"""
Phase 9 — AI Symptom Checker orchestration.

Flow per message:
 1. Safety pre-check: regex red-flag scan of the patient's message
    (works even if the LLM misbehaves — fail-safe triage).
 2. Retrieve relevant knowledge chunks (pgvector semantic search).
 3. Build a strict RAG prompt: answer ONLY from context, must return JSON.
 4. Call Groq, parse + Pydantic-validate the structured response.
 5. Safety post-check: emergency red flags detected by regex ALWAYS
    override the LLM's urgency upward (never downward).
 6. Persist conversation + both messages.

This is educational triage guidance, NOT a diagnosis — every response
carries a disclaimer, and emergency cases are pushed to real care.
"""

import json
import re

from groq import Groq
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.ai_chat import AIConversation, AIMessage
from app.models.user import User
from app.schemas.ai_chat import ChatRequest, TriageResponse, VALID_SPECIALTIES
from app.services.rag_service import retrieve_relevant_chunks

settings = get_settings()

DISCLAIMER = (
    "This is AI-generated guidance for information only, not a medical "
    "diagnosis. Always consult a qualified doctor for confirmation."
)

# ---- Safety / triage layer (regex-based, runs BEFORE the LLM) ----
RED_FLAG_PATTERNS: list[tuple[str, str]] = [
    (r"chest pain|crushing pressure|pain.*arm|pain.*jaw", "Possible heart attack signs (chest pain/radiation)"),
    (r"can'?t breathe|cannot breathe|short(ness)? of breath|difficulty breathing|choking", "Breathing difficulty"),
    (r"face droop|slurred speech|sudden.*weak(ness)?|can'?t move|numb.*one side", "Possible stroke (FAST signs)"),
    (r"suicid\w*|kill myself|end my life|self.?harm|hurt myself", "Mental health crisis — needs immediate human support"),
    (r"severe bleed|bleeding heavily|blood won'?t stop|coughing blood|vomit(ing)? blood", "Severe bleeding"),
    (r"seizure|fit|convulsion|unconscious|passed out|fainted", "Seizure / loss of consciousness"),
    (r"stiff neck.*fever|worst headache|sudden.*worst.*head", "Possible meningitis / severe headache red flag"),
    (r"pregnan\w*.*bleed|blood.*pregnan", "Bleeding during pregnancy"),
    (r"poison|overdose|swallowed", "Poisoning / overdose"),
]

EMERGENCY_MESSAGE = (
    "🚨 Based on what you've described, some symptoms can indicate a serious "
    "emergency. Please do NOT wait for an online reply:\n"
    "• Call your local emergency number or get someone to take you to the "
    "nearest hospital emergency department RIGHT NOW.\n"
    "• If this involves thoughts of self-harm, please reach out immediately "
    "to a trusted person nearby and a crisis helpline — you deserve support.\n\n"
    "I'm an AI assistant and cannot help in an emergency. Real medical help, "
    "right now, is what you need."
)

GREETING_RE = re.compile(
    r"^\s*(hi+|hello+|hey+|hii+|hlo+|good\s*(morning|afternoon|evening)|"
    r"thanks?|thank\s*you|ok(ay)?|how\s*are\s*you)[\s!.,?]*$",
    re.IGNORECASE,
)

GREETING_REPLY = (
    "Hello! 👋 I'm your AI symptom checker. Describe what you're feeling — "
    'for example: "I have an itchy rash on my arm since two days" or '
    '"I\'ve had a headache and mild fever since yesterday" — and I\'ll help '
    "you understand it and suggest the right type of doctor."
)

# Model may hallucinate a specialty outside the platform — map to fallback
_SPECIALTY_FALLBACK = "General Medicine"


def scan_red_flags(message: str) -> list[str]:
    """Regex scan for emergency indicators. Cheap, deterministic, fail-safe."""
    lowered = message.lower()
    return [desc for pattern, desc in RED_FLAG_PATTERNS if re.search(pattern, lowered)]


def _get_groq_client() -> Groq:
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not configured — add it to .env")
    return Groq(api_key=settings.groq_api_key)


def _build_prompt(patient_message: str, history: list[tuple[str, str]], context_chunks: list[dict]) -> str:
    context = "\n\n---\n\n".join(
        f"[Source: {c['title']}]\n{c['content']}" for c in context_chunks
    )
    history_txt = "\n".join(f"{role}: {content}" for role, content in history[-6:])
    return f"""You are a careful medical triage assistant on a telemedicine platform.
You help patients understand symptoms and decide which specialist to see and how urgently.

STRICT RULES:
1. You ARE allowed and expected to give helpful general health information: what commonly causes these symptoms, safe home care, and when to see a doctor. This is patient education, not diagnosis.
2. Base your answer ONLY on the knowledge context below. If the context doesn't cover something, say so generally and recommend seeing a doctor — do NOT refuse to answer entirely.
3. NEVER give specific drug dosages or prescribe medication. General advice like "rest, hydrate, a doctor may recommend paracetamol" is fine.
4. Use caring, patient-friendly language. Phrases like "this is commonly associated with" are good; you never claim certainty.
5. If any emergency red flag is present in the patient's message or context, set urgency to "emergency".
6. You MUST respond with ONLY a valid JSON object, no markdown fences, matching exactly:
   {{"answer": "<helpful, warm reply to the patient>", "urgency": "emergency|urgent|soon|routine", "recommended_specialty": "General Medicine|Cardiology|Dermatology|Pediatrics|Orthopedics", "red_flags": ["<flag>", ...]}}
7. recommended_specialty MUST be one of: {", ".join(sorted(VALID_SPECIALTIES))}. If unsure, use "General Medicine".
8. red_flags: list the emergency signs you detected, [] if none.

EXAMPLE of a good answer style: "An itchy rash that appeared over two days is commonly caused by contact irritation, an allergic reaction, or a mild skin condition. Keep the area clean and dry, avoid scratching, and consider an over-the-counter soothing lotion. If it spreads, blisters, or you develop fever, please see a doctor soon. A Dermatologist would be the right specialist to evaluate this."


Platform specialties: {", ".join(sorted(VALID_SPECIALTIES))}

KNOWLEDGE CONTEXT:
{context}

RECENT CONVERSATION:
{history_txt if history_txt else "(first message)"}

PATIENT'S NEW MESSAGE:
{patient_message}

Respond with the JSON object only:"""


def _call_llm(prompt: str) -> TriageResponse:
    """Call Groq, parse JSON, validate. One retry on malformed output."""
    client = _get_groq_client()
    last_err: Exception | None = None
    for attempt in range(2):
        response = client.chat.completions.create(
            model=settings.ai_chat_model,
            messages=[
                {"role": "system", "content": "You are a medical triage JSON API. Output JSON only."},
                {"role": "user", "content": prompt if attempt == 0 else prompt + "\n\nIMPORTANT: your previous output was not valid JSON. Return ONLY the raw JSON object."},
            ],
            temperature=0.2,
            max_tokens=1024,
        )
        raw = response.choices[0].message.content or ""
        try:
            # strip possible ```json fences
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
            return TriageResponse.model_validate_json(cleaned)
        except Exception as e:  # json error or validation error
            last_err = e
    raise ValueError(f"AI returned invalid response after retry: {last_err}")


def _urgency_rank(u: str) -> int:
    return {"routine": 0, "soon": 1, "urgent": 2, "emergency": 3}.get(u, 0)


def get_or_create_conversation(db: Session, patient_id: int, conversation_id: int | None) -> AIConversation:
    if conversation_id is not None:
        conv = db.get(AIConversation, conversation_id)
        if conv is None or conv.patient_id != patient_id:
            raise ValueError("Conversation not found")
        return conv
    conv = AIConversation(patient_id=patient_id)
    db.add(conv)
    db.flush()
    return conv


def process_chat_message(db: Session, patient: "User", req: ChatRequest) -> dict:
    """
    Main entry point called by the router. Returns a dict matching
    ChatResponse. Raises ValueError for user-facing errors.
    """
    # 1. Safety pre-check — deterministic regex triage
    flags = scan_red_flags(req.message)

    conv = get_or_create_conversation(db, patient.id, req.conversation_id)
    if conv.title is None:
        conv.title = req.message[:80]

    # 2. Load short history (for conversational context)
    history = [
        (m.role, m.content)
        for m in conv.messages[-6:]
    ]

    # 3. Semantic retrieval
    chunks = retrieve_relevant_chunks(db, req.message, top_k=4)

    # 4. LLM + structured validation
    if GREETING_RE.match(req.message):
        triage = TriageResponse(
            answer=GREETING_REPLY,
            urgency="routine",
            recommended_specialty=None,
            red_flags=[],
        )
    else:
        prompt = _build_prompt(req.message, history, chunks)
        triage = _call_llm(prompt)

    # 5. Safety post-check — regex flags ALWAYS escalate urgency, never de-escalate
    #    Regex-detected flags force the hardcoded emergency message (fail-safe).
    all_flags = list({*triage.red_flags, *flags})
    if flags:
        triage.urgency = "emergency"
        triage.answer = EMERGENCY_MESSAGE
        triage.recommended_specialty = _SPECIALTY_FALLBACK
    elif all_flags and _urgency_rank(triage.urgency) < _urgency_rank("emergency"):
        triage.urgency = "emergency"

    # 6. Persist both messages
    db.add(AIMessage(conversation_id=conv.id, role="user", content=req.message))
    db.add(AIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=triage.answer,
        meta_json=json.dumps({
            "urgency": triage.urgency,
            "recommended_specialty": triage.recommended_specialty,
            "red_flags": all_flags,
        }),
    ))

    db.commit()

    return {
        "conversation_id": conv.id,
        "answer": triage.answer,
        "urgency": triage.urgency,
        "recommended_specialty": None if triage.urgency == "emergency" else triage.recommended_specialty,
        "red_flags": all_flags,
        "disclaimer": DISCLAIMER,
    }


def get_conversation_history(db: Session, patient_id: int, conversation_id: int) -> list[dict]:
    conv = db.get(AIConversation, conversation_id)
    if conv is None or conv.patient_id != patient_id:
        raise ValueError("Conversation not found")
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "meta": json.loads(m.meta_json) if m.meta_json else None,
            "created_at": m.created_at.isoformat(),
        }
        for m in conv.messages
    ]


def list_conversations(db: Session, patient_id: int) -> list[dict]:
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.patient_id == patient_id)
        .order_by(AIConversation.created_at.desc())
        .all()
    )
    return [
        {"id": c.id, "title": c.title or "Symptom check", "created_at": c.created_at.isoformat()}
        for c in convs
    ]
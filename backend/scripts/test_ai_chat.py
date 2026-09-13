import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.models  # noqa: F401
from app.database.session import SessionLocal
from app.models.user import User
from app.services import ai_chat_service
from app.schemas.ai_chat import ChatRequest

db = SessionLocal()
patient = db.query(User).filter(User.role == "patient").first()
if not patient:
    print("ERROR: no patient user in DB"); raise SystemExit

print("== Test 1: routine ==")
r = ai_chat_service.process_chat_message(db, patient, ChatRequest(message="I have a mild rash on my arm, slightly itchy, since 2 days"))
print(r["urgency"], "|", r["recommended_specialty"], "|", r["answer"][:150])

print("\n== Test 2: EMERGENCY (regex override) ==")
r2 = ai_chat_service.process_chat_message(db, patient, ChatRequest(message="I have crushing chest pain and my left arm hurts and I'm sweating"))
print(r2["urgency"], "|", r2["red_flags"], "|", r2["answer"][:120])


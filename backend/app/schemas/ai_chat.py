"""Phase 9 — AI Symptom Checker schemas."""

from pydantic import BaseModel, Field, field_validator


class UrgencyLevel:
    """Valid urgency values (kept simple, validated below)."""
    EMERGENCY = "emergency"
    URGENT = "urgent"
    SOON = "soon"
    ROUTINE = "routine"


VALID_URGENCIES = {"emergency", "urgent", "soon", "routine"}
VALID_SPECIALTIES = {"General Medicine", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics"}


class TriageResponse(BaseModel):
    """
    Structured JSON the LLM must return. Pydantic validates it —
    if the model outputs malformed/out-of-range values, we fail closed
    (see ai_chat_service) and re-ask once, then fall back to safe text.
    """
    answer: str = Field(min_length=1, description="Grounded, patient-friendly reply")
    urgency: str = Field(description="emergency | urgent | soon | routine")
    recommended_specialty: str | None = Field(default=None, description="One of the platform's 5 specialties")
    red_flags: list[str] = Field(default_factory=list, description="Emergency signs detected in the message")

    @field_validator("urgency")
    @classmethod
    def urgency_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_URGENCIES:
            raise ValueError(f"urgency must be one of {VALID_URGENCIES}")
        return v

    @field_validator("recommended_specialty")
    @classmethod
    def specialty_valid(cls, v):
        if v is None:          # ← ADD THIS — greeting/emergency allow no specialty
            return None
        v = v.strip()
        if v.lower() in (s.lower() for s in VALID_SPECIALTIES):
            return v
        raise ValueError(f"recommended_specialty must be one of: {VALID_SPECIALTIES}")



class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: int | None = None  # None = start new conversation


class SuggestedDoctor(BaseModel):
    id: int
    doctor_profile_id: int 
    full_name: str
    specialty: str | None = None
    rating: float | None = None
    consultation_fee: float | None = None


class ChatResponse(BaseModel):
    conversation_id: int
    answer: str
    urgency: str
    recommended_specialty: str | None = None
    red_flags: list[str] = []
    disclaimer: str
    suggested_doctors: list[SuggestedDoctor] = []

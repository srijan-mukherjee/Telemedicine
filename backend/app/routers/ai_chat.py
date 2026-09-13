"""
Phase 9 — AI Symptom Checker endpoints (patients only).

POST /api/ai-chat            → send a message, get structured triage + suggested doctors
GET  /api/ai-chat/conversations           → list my conversations
GET  /api/ai-chat/conversations/{id}      → full message history
"""

import json
import traceback  # ← Added to debug 502 errors

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.doctor_profile import DoctorProfile
from app.models.enums import DoctorStatus, UserRole
from app.models.specialty import Specialty
from app.models.user import User
from app.schemas.ai_chat import ChatRequest, ChatResponse, SuggestedDoctor
from app.services import ai_chat_service

router = APIRouter(prefix="/ai-chat", tags=["AI Symptom Checker"])


def _dec(v: Decimal | None) -> float | None:
    return float(v) if v is not None else None


def _suggest_doctors(db: Session, specialty_name: str | None, limit: int = 3) -> list[SuggestedDoctor]:
    """
    Find Doctor integration: approved doctors in the recommended specialty
    (joined via specialties table), falling back to General Medicine, then
    any specialty. Ordered by rating desc.
    """
    base = (
        db.query(DoctorProfile, User, Specialty.name.label("specialty_name"))
        .join(User, DoctorProfile.user_id == User.id)
        .join(Specialty, DoctorProfile.specialty_id == Specialty.id)
        .filter(DoctorProfile.status == DoctorStatus.approved)
        .order_by(DoctorProfile.rating.desc().nullslast())
    )

    def to_suggested(rows) -> list[SuggestedDoctor]:
        return [
            SuggestedDoctor(
                id=d.user_id,          # user_id — what booking/auth flows use
                doctor_profile_id=d.id,
                full_name=u.full_name,
                specialty=sname,
                rating=_dec(d.rating),
                consultation_fee=_dec(d.consultation_fee),
            )
            for d, u, sname in rows
        ]

    # 1st choice: recommended specialty
    if specialty_name:
        rows = base.filter(Specialty.name == specialty_name).limit(limit).all()
        if rows:
            return to_suggested(rows)

    # 2nd: General Medicine, 3rd: anyone approved
    rows = base.filter(Specialty.name == "General Medicine").limit(limit).all()
    if rows:
        return to_suggested(rows)
    
    return to_suggested(base.limit(limit).all())


@router.post("", response_model=ChatResponse)
def send_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a symptom message; returns triage guidance + doctor suggestions."""
    try:
        result = ai_chat_service.process_chat_message(db, current_user, req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        traceback.print_exc()   # ← Added traceback print to catch the hidden error
        # LLM/API failure — fail safe, never expose internals
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service is temporarily unavailable. Please try again shortly.",
        ) from e

    # Suggested doctors only make sense for non-emergency (they should go to ER, not book!)
    result["suggested_doctors"] = []
    if result["urgency"] != "emergency" and result.get("recommended_specialty"):
        result["suggested_doctors"] = [
            sd.model_dump() for sd in _suggest_doctors(db, result["recommended_specialty"])
        ]
        
    return result


@router.get("/conversations")
def my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ai_chat_service.list_conversations(db, current_user.id)


@router.get("/conversations/{conversation_id}")
def conversation_history(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return ai_chat_service.get_conversation_history(db, current_user.id, conversation_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
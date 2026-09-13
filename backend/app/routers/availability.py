"""Doctor availability endpoints.

Doctors manage their own schedule. Patients can read generated slots
for approved doctors before Phase 4 turns those slots into bookings.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.availability import AvailabilityCreate, AvailabilityOut, SlotOut
from app.services import availability_service, doctor_service

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("/me", response_model=list[AvailabilityOut])
def list_my_availability(
    current_user: User = Depends(require_roles("doctor")),
    db: Session = Depends(get_db),
):
    profile = doctor_service.get_own_doctor_profile(current_user)
    return availability_service.list_for_doctor(db, profile.id)


@router.post("/me", response_model=AvailabilityOut, status_code=status.HTTP_201_CREATED)
def create_my_availability(
    data: AvailabilityCreate,
    current_user: User = Depends(require_roles("doctor")),
    db: Session = Depends(get_db),
):
    profile = doctor_service.get_own_doctor_profile(current_user)
    return availability_service.create_for_doctor(db, profile.id, data)


@router.delete("/me/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_availability(
    availability_id: int,
    current_user: User = Depends(require_roles("doctor")),
    db: Session = Depends(get_db),
):
    profile = doctor_service.get_own_doctor_profile(current_user)
    availability_service.delete_for_doctor(db, profile.id, availability_id)


@router.get("/doctors/{doctor_id}/slots", response_model=list[SlotOut])
def list_doctor_slots(
    doctor_id: int,
    slot_date: date = Query(alias="date"),
    db: Session = Depends(get_db),
):
    return availability_service.generate_slots(db, doctor_id, slot_date)

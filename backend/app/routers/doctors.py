"""Doctor profile and public doctor search endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.doctor import DoctorProfileUpdate, DoctorPublicOut
from app.services import doctor_service

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("", response_model=list[DoctorPublicOut])
def list_doctors(
    specialty_id: int | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    db: Session = Depends(get_db),
):
    return doctor_service.list_public_doctors(db, specialty_id=specialty_id, search=search)


@router.get("/me/profile", response_model=DoctorPublicOut)
def read_my_doctor_profile(
    current_user: User = Depends(require_roles("doctor")),
):
    profile = doctor_service.get_own_doctor_profile(current_user)
    return doctor_service.to_public_doctor(profile)


@router.patch("/me/profile", response_model=DoctorPublicOut)
def update_my_doctor_profile(
    data: DoctorProfileUpdate,
    current_user: User = Depends(require_roles("doctor")),
    db: Session = Depends(get_db),
):
    return doctor_service.update_own_profile(db, current_user, data)


@router.get("/{doctor_id}", response_model=DoctorPublicOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return doctor_service.get_public_doctor(db, doctor_id)

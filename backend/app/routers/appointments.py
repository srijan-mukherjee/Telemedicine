from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.core.dependencies import get_current_user, get_current_patient, get_current_doctor
from app.models.user import User
from app.models.appointment import Appointment  # <-- THIS WAS MISSING
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentUpdateStatus
from app.services import appointment_service

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient)
):
    try:
        return appointment_service.create_appointment(db, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{appointment_id}/confirm", response_model=AppointmentOut)
def confirm_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient)
):
    try:
        return appointment_service.confirm_appointment(db, appointment_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return appointment_service.cancel_appointment(db, appointment_id, current_user.id, current_user.role.value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/me", response_model=List[AppointmentOut])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.value == "patient":
        return db.query(Appointment).filter(Appointment.patient_id == current_user.id).all()
    elif current_user.role.value == "doctor":
        return db.query(Appointment).filter(Appointment.doctor_id == current_user.id).all()
    else:
        raise HTTPException(status_code=403, detail="Access denied")
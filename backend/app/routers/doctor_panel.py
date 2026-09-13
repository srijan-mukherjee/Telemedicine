"""Doctor panel endpoints — thin routes over doctor_panel_service."""

from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_doctor
from app.database.session import get_db
from app.models.user import User
from app.schemas.appointment import AppointmentStatus, AppointmentUpdateStatus, DoctorAppointmentOut, TodayStats
from app.schemas.appointment import DoctorPatientOut
from app.services import doctor_panel_service
from app.services.doctor_panel_service import TransitionError

router = APIRouter(prefix="/doctor-panel", tags=["doctor-panel"])


@router.get("/today", response_model=list[DoctorAppointmentOut])
def todays_appointments(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return doctor_panel_service.get_today_appointments(db, current_user.id)


@router.get("/appointments", response_model=list[DoctorAppointmentOut])
def list_appointments(
    date: date_type | None = Query(None, description="Filter by day (YYYY-MM-DD)"),
    status: AppointmentStatus | None = Query(None),
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return doctor_panel_service.list_appointments(db, current_user.id, date, status)


@router.patch("/appointments/{appointment_id}/status", response_model=DoctorAppointmentOut)
def update_status(
    appointment_id: int,
    body: AppointmentUpdateStatus,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    try:
        return doctor_panel_service.update_status(
            db, appointment_id, current_user.id, body.status
        )
    except TransitionError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/stats/today", response_model=TodayStats  )
def stats_today(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return doctor_panel_service.today_stats(db, current_user.id)

@router.get("/patients", response_model=list[DoctorPatientOut])
def my_patients(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    return doctor_panel_service.get_patients(db, current_user.id)


@router.get("/patients/{patient_id}/history", response_model=list[DoctorAppointmentOut])
def patient_history(
    patient_id: int,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
):
    try:
        return doctor_panel_service.get_patient_history(db, current_user.id, patient_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

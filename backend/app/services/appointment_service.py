from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import secrets
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.appointment import AppointmentCreate
from sqlalchemy.exc import IntegrityError 

def generate_reference():
    return "APPT-" + secrets.token_hex(6).upper()

def create_appointment(db: Session, patient_id: int, data: AppointmentCreate):
    # 1. Validate doctor exists and is active
    doctor = db.get(User, data.doctor_id)
    if not doctor or doctor.role != UserRole.doctor or not doctor.is_active:
        raise ValueError("Invalid or inactive doctor")

    start_time = data.appointment_datetime
    if start_time <= datetime.now():
        raise ValueError("Cannot book an appointment in the past")
    # 2. Concurrency lock: prevent double-booking
    existing = db.execute(
        select(Appointment)
        .where(
            Appointment.doctor_id == data.doctor_id,
            Appointment.appointment_datetime == start_time,
            Appointment.status.in_([
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.WAITING,
                AppointmentStatus.IN_CONSULTATION
            ])
        )
        .with_for_update()
    ).scalar_one_or_none()

    if existing:
        raise ValueError("This time slot is already booked or pending.")

    # 3. Create appointment
    ref = generate_reference()
    new_appt = Appointment(
        patient_id=patient_id,
        doctor_id=data.doctor_id,
        appointment_datetime=start_time,
        reason_text=data.reason_text,
        reference_number=ref,
        status=AppointmentStatus.PENDING
    )
    db.add(new_appt)
    try:
        db.commit()
        db.refresh(new_appt)
    except IntegrityError:
        db.rollback()
        raise ValueError("This time slot is already booked.")
    return new_appt

def confirm_appointment(db: Session, appointment_id: int, patient_id: int):
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise ValueError("Appointment not found")
    if appt.patient_id != patient_id:
        raise ValueError("Not authorized")
    if appt.status != AppointmentStatus.PENDING:
        raise ValueError("Only pending appointments can be confirmed")
    appt.status = AppointmentStatus.CONFIRMED
    db.commit()
    return appt

def cancel_appointment(db: Session, appointment_id: int, user_id: int, role: str):
    appt = db.get(Appointment, appointment_id)
    if not appt:
        raise ValueError("Appointment not found")
    if appt.patient_id != user_id and appt.doctor_id != user_id:
        raise ValueError("Not authorized to cancel this appointment")
    if appt.status not in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
        raise ValueError("This appointment cannot be cancelled in its current state")
    appt.status = AppointmentStatus.CANCELLED
    if role == "doctor" or appt.doctor_id == user_id:
        appt.reason_text = (appt.reason_text or "") + "\n[Cancelled by doctor]"
    db.commit()
    return appt
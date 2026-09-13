"""Prescription business logic.

Rules:
- Only the appointment's own doctor may create/edit a prescription.
- Only while the appointment is IN_CONSULTATION or COMPLETED.
- One prescription per appointment (unique).
- Patients may read prescriptions only from their own appointments.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.prescription import Prescription, PrescriptionItem
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate

ALLOWED_STATUSES = (AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED)


def _get_own_appointment(db: Session, appointment_id: int, doctor: User) -> Appointment:
    appt = db.get(Appointment, appointment_id)
    if appt is None or appt.doctor_id != doctor.id:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


def _replace_items(db: Session, rx: Prescription, items) -> None:
    rx.items.clear()
    db.flush()
    for it in items:
        rx.items.append(PrescriptionItem(
            medicine_name=it.medicine_name,
            dosage=it.dosage,
            frequency=it.frequency,
            duration_days=it.duration_days,
        ))


def create_for_appointment(
    db: Session, appointment_id: int, doctor: User, data: PrescriptionCreate
) -> Prescription:
    appt = _get_own_appointment(db, appointment_id, doctor)

    if appt.status not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Prescriptions can only be written during or after consultation",
        )
    existing = db.query(Prescription).filter(
        Prescription.appointment_id == appointment_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A prescription already exists for this appointment",
        )

    rx = Prescription(
        appointment_id=appointment_id,
        doctor_id=doctor.id,
        patient_id=appt.patient_id,
        diagnosis=data.diagnosis,
        advice=data.advice,
        clinical_notes=data.clinical_notes,
    )
    db.add(rx)
    db.flush()
    _replace_items(db, rx, data.items)
    db.commit()
    db.refresh(rx)
    return rx


def update_for_appointment(
    db: Session, appointment_id: int, doctor: User, data: PrescriptionUpdate
) -> Prescription:
    rx = (
        db.query(Prescription)
        .filter(Prescription.appointment_id == appointment_id)
        .first()
    )
    if rx is None or rx.doctor_id != doctor.id:
        raise HTTPException(status_code=404, detail="Prescription not found")

    rx.diagnosis = data.diagnosis
    rx.advice = data.advice
    rx.clinical_notes = data.clinical_notes
    _replace_items(db, rx, data.items)
    db.commit()
    db.refresh(rx)
    return rx


def get_for_appointment(db: Session, appointment_id: int, user: User) -> Prescription:
    appt = db.get(Appointment, appointment_id)
    if appt is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if user.id not in (appt.doctor_id, appt.patient_id):
        # Do not reveal existence to unrelated users.
        raise HTTPException(status_code=404, detail="Appointment not found")

    rx = (
        db.query(Prescription)
        .filter(Prescription.appointment_id == appointment_id)
        .first()
    )
    if rx is None:
        raise HTTPException(status_code=404, detail="No prescription for this appointment")
    return rx


def list_for_user(db: Session, user: User) -> list[Prescription]:
    return (
        db.query(Prescription)
        .filter(Prescription.patient_id == user.id if user.role.value == "patient"
                else Prescription.doctor_id == user.id)
        .order_by(Prescription.created_at.desc())
        .all()
    )

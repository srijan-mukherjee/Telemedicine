"""
Doctor panel business logic.

Phase 6: today's appointments, filtered listings, and doctor-side
status transitions. Routers stay thin — all rules live here.

The transition map is the single source of truth for which status
changes a doctor may perform; anything not listed here is rejected.
"""
import uuid  # <-- NEW IMPORT
from datetime import datetime, date, time
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.enums import UserRole
from app.models.patient_profile import PatientProfile
from app.models.user import User


# Legal doctor-driven transitions.
DOCTOR_TRANSITIONS = {
    AppointmentStatus.PENDING: {AppointmentStatus.CONFIRMED},
    AppointmentStatus.CONFIRMED: {
        AppointmentStatus.WAITING,
        AppointmentStatus.COMPLETED,
    },
    AppointmentStatus.WAITING: {AppointmentStatus.IN_CONSULTATION},
    AppointmentStatus.IN_CONSULTATION: {AppointmentStatus.COMPLETED},
}

# A doctor can still cancel these (mirrors the patient-side rule
# in appointment_service.cancel_appointment).
DOCTOR_CANCELLABLE = {
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
}

ACTIVE_STATUSES = [
    AppointmentStatus.PENDING,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.WAITING,
    AppointmentStatus.IN_CONSULTATION,
]


class TransitionError(ValueError):
    """Raised when an illegal status change is attempted."""


def get_today_appointments(db: Session, doctor_id: int) -> list[dict]:
    start = datetime.combine(date.today(), time.min)
    end = datetime.combine(date.today(), time.max)

    rows = (
        db.execute(
            select(Appointment, User, PatientProfile)
            .join(User, Appointment.patient_id == User.id)
            .outerjoin(PatientProfile, PatientProfile.user_id == User.id)
            .where(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_datetime >= start,
                Appointment.appointment_datetime <= end,
                Appointment.status.in_(ACTIVE_STATUSES),
            )
            .order_by(Appointment.appointment_datetime)
        )
        .all()
    )
    return [_serialize(appt, user, profile) for appt, user, profile in rows]


def list_appointments(
    db: Session,
    doctor_id: int,
    day: date | None = None,
    status_filter: AppointmentStatus | None = None,
) -> list[dict]:
    stmt = (
        select(Appointment, User, PatientProfile)
        .join(User, Appointment.patient_id == User.id)
        .outerjoin(PatientProfile, PatientProfile.user_id == User.id)
        .where(Appointment.doctor_id == doctor_id)
    )
    if day:
        stmt = stmt.where(
            Appointment.appointment_datetime >= datetime.combine(day, time.min),
            Appointment.appointment_datetime <= datetime.combine(day, time.max),
        )
    if status_filter:
        stmt = stmt.where(Appointment.status == status_filter)

    stmt = stmt.order_by(Appointment.appointment_datetime.desc())
    rows = db.execute(stmt).all()
    return [_serialize(appt, user, profile) for appt, user, profile in rows]


def update_status(
    db: Session, appointment_id: int, doctor_id: int, new_status: AppointmentStatus
) -> dict:
    appt = db.get(Appointment, appointment_id)
    if not appt or appt.doctor_id != doctor_id:
        raise ValueError("Appointment not found")

    # Cancel is allowed from the cancellable set regardless of the map.
    if new_status == AppointmentStatus.CANCELLED:
        if appt.status not in DOCTOR_CANCELLABLE:
            raise TransitionError(
                "This appointment cannot be cancelled in its current state"
            )
    else:
        allowed = DOCTOR_TRANSITIONS.get(appt.status, set())
        if new_status not in allowed:
            raise TransitionError(
                f"Illegal transition: {appt.status.value} → {new_status.value}"
            )

    # --- NEW JITSI LINK GENERATION ---
    if new_status == AppointmentStatus.IN_CONSULTATION and not appt.meeting_link:
        unique_hash = uuid.uuid4().hex[:8]
        
        # Changed from meet.jit.si to a truly anonymous public instance
        appt.meeting_link = f"https://meet.ffmuc.net/Consultation-{appt.reference_number}-{unique_hash}"
    # ---------------------------------

    appt.status = new_status
    db.commit()
    db.refresh(appt)

    user = db.get(User, appt.patient_id)
    profile = db.execute(
        select(PatientProfile).where(PatientProfile.user_id == appt.patient_id)
    ).scalar_one_or_none()
    return _serialize(appt, user, profile)


def today_stats(db: Session, doctor_id: int) -> dict:
    start = datetime.combine(date.today(), time.min)
    end = datetime.combine(date.today(), time.max)

    rows = db.execute(
        select(Appointment.status)
        .where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_datetime >= start,
            Appointment.appointment_datetime <= end,
        )
    ).scalars().all()

    counts = {s.value: 0 for s in AppointmentStatus}
    counts["TOTAL"] = len(rows)
    for s in rows:
        counts[s.value] += 1
    return counts


def _serialize(appt: Appointment, user: User, profile: PatientProfile | None) -> dict:
    age = None
    if profile and profile.date_of_birth:
        today = date.today()
        dob = profile.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "patient_name": user.full_name,
        "patient_age": age,
        "patient_blood_group": profile.blood_group if profile else None,
        "appointment_datetime": appt.appointment_datetime,
        "status": appt.status,
        "reason_text": appt.reason_text,
        "reference_number": appt.reference_number,
        "booked_at": appt.booked_at,
        "meeting_link": appt.meeting_link,  # <-- NEW FIELD ADDED HERE
    }

def get_patients(db: Session, doctor_id: int) -> list[dict]:
    """Distinct patients who have at least one appointment with this doctor."""
    rows = (
        db.execute(
            select(User, PatientProfile)
            .distinct()
            .join(Appointment, Appointment.patient_id == User.id)
            .outerjoin(PatientProfile, PatientProfile.user_id == User.id)
            .where(Appointment.doctor_id == doctor_id)
            .order_by(User.full_name)
        )
        .all()
    )
    result = []
    for user, profile in rows:
        age = None
        if profile and profile.date_of_birth:
            today = date.today()
            dob = profile.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        result.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "age": age,
            "blood_group": profile.blood_group if profile else None,
        })
    return result


def get_patient_history(db: Session, doctor_id: int, patient_id: int) -> list[dict]:
    """Authorized history: ONLY appointments between this patient and THIS doctor."""
    # Verify the patient actually belongs to this doctor's panel
    belongs = db.execute(
        select(Appointment.id)
        .where(
            Appointment.doctor_id == doctor_id,
            Appointment.patient_id == patient_id,
        )
        .limit(1)
    ).first()
    if not belongs:
        raise ValueError("Patient not found in your panel")

    rows = (
        db.execute(
            select(Appointment, User, PatientProfile)
            .join(User, Appointment.patient_id == User.id)
            .outerjoin(PatientProfile, PatientProfile.user_id == User.id)
            .where(
                Appointment.doctor_id == doctor_id,
                Appointment.patient_id == patient_id,
            )
            .order_by(Appointment.appointment_datetime.desc())
        )
        .all()
    )
    return [_serialize(appt, user, profile) for appt, user, profile in rows]
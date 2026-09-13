"""Doctor availability validation and dynamic 30-minute slot generation."""

from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from sqlalchemy import select, func  
from app.models.appointment import Appointment, AppointmentStatus   



from app.models.appointment import Appointment
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor_profile import DoctorProfile
from app.models.enums import DoctorStatus
from app.models.specialty import Specialty
from app.models.user import User
from app.schemas.availability import AvailabilityCreate, SlotOut

SLOT_MINUTES = 30


def list_for_doctor(db: Session, doctor_id: int) -> list[DoctorAvailability]:
    stmt = (
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == doctor_id)
        .order_by(
            DoctorAvailability.is_recurring.desc(),
            DoctorAvailability.day_of_week,
            DoctorAvailability.specific_date,
            DoctorAvailability.start_time,
        )
    )
    return db.execute(stmt).scalars().all()


def create_for_doctor(db: Session, doctor_id: int, data: AvailabilityCreate) -> DoctorAvailability:
    _ensure_no_conflict(db, doctor_id, data)
    availability = DoctorAvailability(doctor_id=doctor_id, **data.model_dump())
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability


def delete_for_doctor(db: Session, doctor_id: int, availability_id: int) -> None:
    availability = db.get(DoctorAvailability, availability_id)
    if availability is None or availability.doctor_id != doctor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability not found")
    db.delete(availability)
    db.commit()

def _booked_datetimes(db: Session, doctor_id: int, slot_date: date) -> set[datetime]:
    """Datetimes already consumed by an active appointment for this doctor on this date.
    Cancelled appointments free the slot back up."""
    stmt = select(Appointment.appointment_datetime).where(
        Appointment.doctor_id == doctor_id,
        Appointment.status != AppointmentStatus.CANCELLED,   # ← uppercase member
        func.date(Appointment.appointment_datetime) == slot_date,
    )
    return {dt for (dt,) in db.execute(stmt).all()}



def generate_slots(db: Session, doctor_id: int, slot_date: date) -> list[SlotOut]:
    if slot_date < date.today():
        return []
    _get_public_bookable_doctor(db, doctor_id)
    booked = _booked_datetimes(db, doctor_id, slot_date) 
    rows = list_for_doctor(db, doctor_id)

    if any(row.is_holiday and row.specific_date == slot_date for row in rows):
        return []

    windows = [
        row
        for row in rows
        if not row.is_holiday
        and (
            (row.is_recurring and row.day_of_week == slot_date.weekday())
            or (not row.is_recurring and row.specific_date == slot_date)
        )
    ]

    seen: set[tuple[str, str]] = set()
    slots: list[SlotOut] = []
    for window in windows:
        start_dt = datetime.combine(slot_date, window.start_time)
        end_dt = datetime.combine(slot_date, window.end_time)
        current = start_dt
        while current + timedelta(minutes=SLOT_MINUTES) <= end_dt:
            slot_end = current + timedelta(minutes=SLOT_MINUTES)
            if current not in booked:                      
                key = (current.time().isoformat(), slot_end.time().isoformat())
                if key not in seen:
                    seen.add(key)
                    slots.append(
                        SlotOut(
                            doctor_id=doctor_id,
                            date=slot_date,
                            start_time=current.time(),
                            end_time=slot_end.time(),
                            slot_datetime=current.isoformat(),
                        )
                    )
            current = slot_end


    return sorted(slots, key=lambda slot: slot.start_time)


def _get_public_bookable_doctor(db: Session, doctor_id: int) -> DoctorProfile:
    profile = (
        db.execute(
            select(DoctorProfile)
            .join(DoctorProfile.user)
            .join(DoctorProfile.specialty)
            .where(
                DoctorProfile.id == doctor_id,
                DoctorProfile.status == DoctorStatus.approved,
                User.is_active.is_(True),
                Specialty.is_active.is_(True),
            )
        )
        .scalars()
        .first()
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return profile


def _ensure_no_conflict(db: Session, doctor_id: int, data: AvailabilityCreate) -> None:
    if data.is_holiday:
        duplicate = db.execute(
            select(DoctorAvailability).where(
                DoctorAvailability.doctor_id == doctor_id,
                DoctorAvailability.is_holiday.is_(True),
                DoctorAvailability.specific_date == data.specific_date,
            )
        ).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Holiday already exists for this date")
        return

    stmt = select(DoctorAvailability).where(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.is_holiday.is_(False),
        DoctorAvailability.start_time < data.end_time,
        DoctorAvailability.end_time > data.start_time,
    )

    if data.is_recurring:
        stmt = stmt.where(
            DoctorAvailability.is_recurring.is_(True),
            DoctorAvailability.day_of_week == data.day_of_week,
        )
    else:
        stmt = stmt.where(
            DoctorAvailability.is_recurring.is_(False),
            DoctorAvailability.specific_date == data.specific_date,
        )

    if db.execute(stmt).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Availability overlaps an existing window")

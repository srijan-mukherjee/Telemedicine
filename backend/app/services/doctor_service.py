"""Doctor profile and public doctor search business logic."""

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.doctor_profile import DoctorProfile
from app.models.enums import DoctorStatus, UserRole
from app.models.specialty import Specialty
from app.models.user import User
from app.schemas.doctor import DoctorProfileUpdate, DoctorPublicOut


def get_own_doctor_profile(user: User) -> DoctorProfile:
    if user.role != UserRole.doctor or user.doctor_profile is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor account required")
    return user.doctor_profile


def to_public_doctor(profile: DoctorProfile) -> DoctorPublicOut:
    return DoctorPublicOut(
        id=profile.id,
        user_id=profile.user_id,
        full_name=profile.user.full_name,
        phone=profile.user.phone,
        specialty_id=profile.specialty_id,
        specialty_name=profile.specialty.name,
        qualification=profile.qualification,
        years_experience=profile.years_experience,
        clinic_address=profile.clinic_address,
        consultation_fee=profile.consultation_fee,
        rating=profile.rating,
        bio=profile.bio,
        status=profile.status,
    )


def list_public_doctors(
    db: Session,
    specialty_id: int | None = None,
    search: str | None = None,
) -> list[DoctorPublicOut]:
    stmt = (
        select(DoctorProfile)
        .join(DoctorProfile.user)
        .join(DoctorProfile.specialty)
        .where(
            DoctorProfile.status == DoctorStatus.approved,
            User.is_active.is_(True),
            Specialty.is_active.is_(True),
        )
        .order_by(User.full_name)
    )

    if specialty_id is not None:
        stmt = stmt.where(DoctorProfile.specialty_id == specialty_id)

    if search:
        pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                User.full_name.ilike(pattern),
                Specialty.name.ilike(pattern),
                DoctorProfile.qualification.ilike(pattern),
            )
        )

    return [to_public_doctor(profile) for profile in db.execute(stmt).scalars().all()]


def get_public_doctor(db: Session, doctor_id: int) -> DoctorPublicOut:
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
    return to_public_doctor(profile)


def update_own_profile(db: Session, user: User, data: DoctorProfileUpdate) -> DoctorPublicOut:
    profile = get_own_doctor_profile(user)
    updates = data.model_dump(exclude_unset=True)

    if "full_name" in updates:
        user.full_name = updates.pop("full_name")
    if "phone" in updates:
        user.phone = updates.pop("phone")

    if "specialty_id" in updates:
        specialty_id = updates["specialty_id"]
        specialty = db.get(Specialty, specialty_id)
        if specialty is None or not specialty.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid specialty")

    for field, value in updates.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return to_public_doctor(profile)

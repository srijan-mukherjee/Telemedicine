"""
Auth business logic. Routers stay thin and call these functions;
these functions never touch `request`/`response` objects directly,
which keeps them independently testable.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.doctor_profile import DoctorProfile
from app.models.enums import DoctorStatus, UserRole
from app.models.patient_profile import PatientProfile
from app.models.specialty import Specialty
from app.models.user import User
from app.repositories import user_repository
from app.schemas.auth import RegisterDoctorRequest, RegisterPatientRequest


def register_patient(db: Session, data: RegisterPatientRequest) -> User:
    if user_repository.get_by_email(db, data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    try:
        password_hash = hash_password(data.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    user = User(
        email=data.email,
        phone=data.phone,
        password_hash=password_hash,
        role=UserRole.patient,
        full_name=data.full_name,
        is_active=True,
    )
    user_repository.create_user(db, user=user)

    profile = PatientProfile(
        user_id=user.id,
        date_of_birth=data.date_of_birth,
        blood_group=data.blood_group,
        address=data.address,
        emergency_contact=data.emergency_contact,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


def register_doctor(db: Session, data: RegisterDoctorRequest) -> User:
    if user_repository.get_by_email(db, data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    specialty = db.get(Specialty, data.specialty_id)
    if specialty is None or not specialty.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid specialty")

    try:
        password_hash = hash_password(data.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    user = User(
        email=data.email,
        phone=data.phone,
        password_hash=password_hash,
        role=UserRole.doctor,
        full_name=data.full_name,
        is_active=True,
    )
    user_repository.create_user(db, user=user)

    profile = DoctorProfile(
        user_id=user.id,
        specialty_id=data.specialty_id,
        qualification=data.qualification,
        years_experience=data.years_experience,
        clinic_address=data.clinic_address,
        consultation_fee=data.consultation_fee,
        bio=data.bio,
        status=DoctorStatus.pending,  # doctors require admin approval — see spec section 4
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = user_repository.get_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    return user


def issue_token_for(user: User) -> str:
    return create_access_token(subject=str(user.id), role=user.role.value)


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    try:
        user.password_hash = hash_password(new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    db.commit()

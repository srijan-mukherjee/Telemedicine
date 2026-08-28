"""User / profile response schemas — what the API returns, never what it trusts as input for role/status."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.enums import DoctorStatus, UserRole


class PatientProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date_of_birth: date | None
    blood_group: str | None
    address: str | None
    emergency_contact: str | None


class DoctorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    specialty_id: int
    qualification: str | None
    years_experience: int | None
    clinic_address: str | None
    consultation_fee: Decimal | None
    rating: Decimal | None
    bio: str | None
    status: DoctorStatus


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    phone: str | None
    role: UserRole
    full_name: str
    is_active: bool
    created_at: datetime
    patient_profile: PatientProfileOut | None = None
    doctor_profile: DoctorProfileOut | None = None

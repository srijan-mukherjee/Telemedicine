"""Doctor profile and public doctor search schemas."""

from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import DoctorStatus


class DoctorProfileUpdate(BaseModel):
    phone: str | None = Field(default=None, max_length=20)
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    specialty_id: int | None = None
    qualification: str | None = Field(default=None, max_length=255)
    years_experience: int | None = Field(default=None, ge=0, le=80)
    clinic_address: str | None = Field(default=None, max_length=500)
    consultation_fee: Decimal | None = Field(default=None, ge=0)
    bio: str | None = Field(default=None, max_length=2000)


class DoctorPublicOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: str | None
    specialty_id: int
    specialty_name: str
    qualification: str | None
    years_experience: int | None
    clinic_address: str | None
    consultation_fee: Decimal | None
    rating: Decimal | None
    bio: str | None
    status: DoctorStatus

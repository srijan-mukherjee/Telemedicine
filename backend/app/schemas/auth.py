"""Auth-related request/response schemas."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class RegisterPatientRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    date_of_birth: date | None = None
    blood_group: str | None = Field(default=None, max_length=5)
    address: str | None = Field(default=None, max_length=500)
    emergency_contact: str | None = Field(default=None, max_length=50)


class RegisterDoctorRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    specialty_id: int
    qualification: str | None = Field(default=None, max_length=255)
    years_experience: int | None = Field(default=None, ge=0, le=80)
    clinic_address: str | None = Field(default=None, max_length=500)
    consultation_fee: Decimal | None = Field(default=None, ge=0)
    bio: str | None = Field(default=None, max_length=2000)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)

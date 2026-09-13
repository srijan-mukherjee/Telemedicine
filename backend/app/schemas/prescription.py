"""Prescription request/response schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PrescriptionItemIn(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=200)
    dosage: str | None = Field(default=None, max_length=100)
    frequency: str | None = Field(default=None, max_length=100)
    duration_days: int | None = Field(default=None, ge=1)


class PrescriptionCreate(BaseModel):
    diagnosis: str | None = None
    advice: str | None = None
    clinical_notes: str | None = None
    items: list[PrescriptionItemIn] = Field(min_length=1)


class PrescriptionUpdate(BaseModel):
    diagnosis: str | None = None
    advice: str | None = None
    clinical_notes: str | None = None
    items: list[PrescriptionItemIn] = Field(min_length=1)


class PrescriptionItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medicine_name: str
    dosage: str | None
    frequency: str | None
    duration_days: int | None


class PrescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    appointment_id: int
    doctor_id: int
    patient_id: int
    diagnosis: str | None
    advice: str | None
    clinical_notes: str | None
    created_at: datetime
    updated_at: datetime
    items: list[PrescriptionItemOut]

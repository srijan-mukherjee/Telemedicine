from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.appointment import AppointmentStatus

class AppointmentBase(BaseModel):
    doctor_id: int
    appointment_datetime: datetime
    reason_text: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatus

class AppointmentOut(AppointmentBase):
    id: int
    patient_id: int
    status: AppointmentStatus
    reference_number: str
    booked_at: datetime
    # NEW FIELD
    meeting_link: Optional[str] = None

    class Config:
        from_attributes = True


# ----- Phase 6: doctor panel -----

class DoctorAppointmentOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    patient_age: Optional[int] = None
    patient_blood_group: Optional[str] = None
    appointment_datetime: datetime
    status: AppointmentStatus
    reason_text: Optional[str] = None
    reference_number: str
    booked_at: datetime
    # NEW FIELD
    meeting_link: Optional[str] = None

    class Config:
        from_attributes = True



class TodayStats(BaseModel):
    TOTAL: int
    PENDING: int = 0
    CONFIRMED: int = 0
    WAITING: int = 0
    IN_CONSULTATION: int = 0
    COMPLETED: int = 0
    CANCELLED: int = 0
    
class DoctorPatientOut(BaseModel):
    id: int
    full_name: str
    email: str
    age: Optional[int] = None
    blood_group: Optional[str] = None
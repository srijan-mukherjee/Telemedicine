"""
Shared enums.

Kept as plain Python (str, Enum) classes rather than importing
SQLAlchemy here, so they can be reused unmodified by Pydantic
schemas as well as SQLAlchemy models.
"""

import enum


class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"


class DoctorStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    blocked = "blocked"

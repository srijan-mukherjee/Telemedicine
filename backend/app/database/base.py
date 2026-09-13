"""
Shared SQLAlchemy declarative base.

Every model (User, PatientProfile, Appointment, ...) added in later
phases will import `Base` from here and inherit from it. Keeping this
in its own module (instead of inside session.py) avoids circular
imports once Alembic needs to import all models for autogeneration.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

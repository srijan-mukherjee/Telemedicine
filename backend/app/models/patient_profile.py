"""Patient-specific profile data (one-to-one with User)."""

from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user = relationship("User", back_populates="patient_profile")

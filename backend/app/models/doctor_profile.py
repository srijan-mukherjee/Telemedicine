"""Doctor-specific profile data (one-to-one with User)."""

from decimal import Decimal

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import DoctorStatus


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    specialty_id: Mapped[int] = mapped_column(ForeignKey("specialties.id"), nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    years_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)
    clinic_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    consultation_fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    status: Mapped[DoctorStatus] = mapped_column(
        Enum(DoctorStatus, name="doctor_status"),
        default=DoctorStatus.pending,
        nullable=False,
    )

    user = relationship("User", back_populates="doctor_profile")
    specialty = relationship("Specialty", back_populates="doctors")
    availability = relationship(
        "DoctorAvailability", back_populates="doctor", cascade="all, delete-orphan"
    )

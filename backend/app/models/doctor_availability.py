"""Doctor availability windows used to generate appointment slots dynamically."""

from datetime import date, time

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctor_profiles.id"), nullable=False, index=True)
    day_of_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    specific_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    doctor = relationship("DoctorProfile", back_populates="availability")

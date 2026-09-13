from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    diagnosis = Column(Text, nullable=True)
    advice = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    appointment = relationship("Appointment")
    items = relationship("PrescriptionItem", cascade="all, delete-orphan", back_populates="prescription")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False, index=True)
    medicine_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=True)      # e.g. "500mg"
    frequency = Column(String(100), nullable=True)   # e.g. "1-0-1"
    duration_days = Column(Integer, nullable=True)

    prescription = relationship("Prescription", back_populates="items")

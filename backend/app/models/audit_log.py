from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database.base import Base



class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=False, index=True)  # no FK — keeps log even if user deleted
    admin_email = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)            # e.g. "DOCTOR_APPROVED"
    target_type = Column(String(50), nullable=False)        # e.g. "user"
    target_id = Column(Integer, nullable=True)
    detail = Column(Text, nullable=True)                    # JSON string or human text
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

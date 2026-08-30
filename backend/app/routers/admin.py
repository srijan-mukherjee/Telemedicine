import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.session import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.appointment import Appointment  
from fastapi import Query



router = APIRouter(prefix="/admin", tags=["admin"])


def log_action(db: Session, admin: User, action: str, target_type: str,
               target_id=None, detail=None):
    db.add(AuditLog(
        admin_id=admin.id,
        admin_email=admin.email,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=json.dumps(detail) if detail else None,
    ))


def _status_value(status):
    """Return plain string whether status is an enum or a string."""
    if status is None:
        return None
    return status.value if hasattr(status, "value") else status


def _doctor_payload(d: User) -> dict:
    p = d.doctor_profile
    return {
        "id": d.id,
        "email": d.email,
        "full_name": d.full_name,
        "phone": getattr(d, "phone", None),
        "specialty": (p.specialty.name
                      if p and getattr(p, "specialty", None) else None),
        "experience_years": (getattr(p, "experience_years", None)
                             or getattr(p, "years_of_experience", None)),
        "fee": getattr(p, "fee", None) or getattr(p, "consultation_fee", None),
        "status": _status_value(p.status if p else None),
    }


@router.get("/doctors")
def list_all_doctors(db: Session = Depends(get_db),
                     admin: User = Depends(require_roles("admin"))):
    """All doctors with profile status — for the approval queue."""
    doctors = db.scalars(select(User).where(User.role == "doctor")).unique().all()
    return [_doctor_payload(d) for d in doctors]


class DoctorStatusUpdate(BaseModel):
    status: str  # "pending" | "approved" | "blocked"


@router.patch("/doctors/{doctor_id}/status")
def set_doctor_status(doctor_id: int, payload: DoctorStatusUpdate,
                      db: Session = Depends(get_db),
                      admin: User = Depends(require_roles("admin"))):
    new_status = payload.status.upper()
    if new_status not in {"PENDING", "APPROVED", "BLOCKED"}:
        raise HTTPException(422, detail="status must be pending, approved, or blocked")

    doctor = db.get(User, doctor_id)
    if not doctor or doctor.role.value != "doctor" or not doctor.doctor_profile:
        raise HTTPException(404, detail="Doctor not found")

    profile_status = doctor.doctor_profile.status
    # If status is an enum, assign through the enum class; else plain string
    if hasattr(profile_status, "value"):
        doctor.doctor_profile.status = type(profile_status)(new_status.lower())
    else:
        doctor.doctor_profile.status = new_status

    log_action(db, admin, f"DOCTOR_{new_status}", "user", doctor.id,
               detail={"email": doctor.email})
    db.commit()
    return {"id": doctor.id, "status": _status_value(doctor.doctor_profile.status)}

@router.get("/users")
def list_all_users(db: Session = Depends(get_db),
                   admin: User = Depends(require_roles("admin"))):
    """All users (patients, doctors, admins) with appointment counts."""
    users = db.scalars(select(User)).unique().all()

    counts = dict(db.execute(
        select(Appointment.patient_id, func.count(Appointment.id))
        .group_by(Appointment.patient_id)
    ).all())

    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role.value,
            "is_active": u.is_active,
            "appointment_count": counts.get(u.id, 0),
            "doctor_status": (u.doctor_profile.status.value
                              if getattr(u, "doctor_profile", None) else None),
        }
        for u in users
    ]
class UserActiveUpdate(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}/active")
def set_user_active(user_id: int, payload: UserActiveUpdate,
                    db: Session = Depends(get_db),
                    admin: User = Depends(require_roles("admin"))):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(422, detail="You cannot deactivate yourself")

    user.is_active = payload.is_active
    log_action(db, admin, "USER_ACTIVATED" if payload.is_active else "USER_DEACTIVATED",
               "user", user.id, detail={"email": user.email})
    db.commit()
    return {"id": user.id, "is_active": user.is_active}



@router.get("/appointments")
def list_all_appointments(
    status: str | None = Query(None, description="Filter by status, e.g. PENDING"),
    doctor_id: int | None = Query(None),
    patient_id: int | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    stmt = select(Appointment).order_by(Appointment.appointment_datetime.desc()).limit(limit).offset(offset)

    if status:
        # if status is an enum column: stmt = stmt.where(Appointment.status == AppointmentStatus(status.lower()))
        stmt = stmt.where(Appointment.status == status.upper())
    if doctor_id:
        stmt = stmt.where(Appointment.doctor_id == doctor_id)
    if patient_id:
        stmt = stmt.where(Appointment.patient_id == patient_id)

    appointments = db.scalars(stmt).unique().all()
    return [
        {
            "id": a.id,
            "doctor_id": a.doctor_id,
            "patient_id": a.patient_id,
            "appointment_datetime": a.appointment_datetime.isoformat(),
            "status": a.status.value if hasattr(a.status, "value") else a.status,
            "reason": getattr(a, "reason", None),
        }
        for a in appointments
    ]

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db),
                  admin: User = Depends(require_roles("admin"))):
    total_users = db.scalar(select(func.count(User.id)))
    total_doctors = db.scalar(select(func.count(User.id)).where(User.role == "doctor"))
    total_patients = db.scalar(select(func.count(User.id)).where(User.role == "patient"))

    by_status = db.execute(
        select(Appointment.status, func.count(Appointment.id)).group_by(Appointment.status)
    ).all()

    return {
        "total_users": total_users,
        "total_doctors": total_doctors,
        "total_patients": total_patients,
        "appointments_by_status": {
            (s.value if hasattr(s, "value") else s): c for s, c in by_status
        },
    }


@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    logs = db.scalars(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit).offset(offset)
    ).all()
    return [
        {
            "id": lg.id,
            "admin_email": lg.admin_email,
            "action": lg.action,
            "target_type": lg.target_type,
            "target_id": lg.target_id,
            "detail": lg.detail,  # JSON string or None
            "created_at": lg.created_at.isoformat(),
        }
        for lg in logs
    ]

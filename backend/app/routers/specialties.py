"""
Specialties: public read (needed for the doctor search filter and
doctor registration form), admin-only write. This is the first
RBAC-protected write endpoint, kept intentionally simple.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.session import get_db
from app.models.specialty import Specialty
from app.schemas.specialty import SpecialtyCreate, SpecialtyOut

router = APIRouter(prefix="/specialties", tags=["specialties"])


@router.get("", response_model=list[SpecialtyOut])
def list_specialties(db: Session = Depends(get_db)):
    stmt = select(Specialty).where(Specialty.is_active.is_(True)).order_by(Specialty.name)
    return db.execute(stmt).scalars().all()


@router.post("", response_model=SpecialtyOut, status_code=status.HTTP_201_CREATED)
def create_specialty(
    data: SpecialtyCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_roles("admin")),
):
    existing = db.execute(select(Specialty).where(Specialty.name == data.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Specialty already exists")

    specialty = Specialty(name=data.name, description=data.description, is_active=True)
    db.add(specialty)
    db.commit()
    db.refresh(specialty)
    return specialty

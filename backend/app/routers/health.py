"""
Health check endpoints.

Used to verify the API process is up, and separately, that the
database connection is actually working (useful for docker-compose
healthchecks and for confirming local Postgres setup in Phase 1).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    """Basic liveness check — does not touch the database."""
    return {"status": "ok"}


@router.get("/health/db")
def health_check_db(db: Session = Depends(get_db)) -> dict:
    """Readiness check — confirms the API can reach PostgreSQL."""
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}

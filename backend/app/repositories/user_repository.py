"""Data-access layer for users. Routers/services never write raw queries directly — they call here."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, *, user: User) -> User:
    db.add(user)
    db.flush()  # assigns user.id without committing yet, so the caller can attach a profile in the same transaction
    return user

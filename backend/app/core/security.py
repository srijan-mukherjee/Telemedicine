"""
Security primitives: password hashing and JWT issuing/verification.

Password hashing uses bcrypt directly (not passlib) to avoid a known
passlib/bcrypt>=4.1 compatibility issue. bcrypt truncates input at 72
bytes; we reject longer passwords explicitly instead of silently
truncating them.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import get_settings

settings = get_settings()

MAX_PASSWORD_BYTES = 72


def hash_password(plain_password: str) -> str:
    if len(plain_password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Password must be at most {MAX_PASSWORD_BYTES} bytes")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # Malformed hash in the DB — treat as a failed verification, not a crash.
        return False


def create_access_token(*, subject: str, role: str, expires_minutes: int | None = None) -> str:
    """
    subject: the user's id (as a string) — becomes the JWT `sub` claim.
    role: embedded in the token so the backend can authorize requests
          without a DB lookup on every call. Still re-validated against
          the DB in get_current_user() to catch deactivated accounts.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    """Raises jwt.PyJWTError (or a subclass) on invalid/expired tokens."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

"""
Auth dependencies.

get_current_user: decodes the JWT, re-checks the user against the DB
(so a deactivated account is rejected even with a still-valid token),
and returns the User row.

require_roles: a dependency factory for per-route RBAC. The frontend
role is NEVER trusted — every protected route re-derives the role
from the verified JWT via get_current_user.
"""

from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise CREDENTIALS_EXCEPTION
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise CREDENTIALS_EXCEPTION

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise CREDENTIALS_EXCEPTION

    user = db.get(User, user_id_int)
    if user is None:
        raise CREDENTIALS_EXCEPTION
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    return user


def require_roles(*allowed_roles: str) -> Callable[[User], User]:
    """
    Usage: Depends(require_roles("doctor", "admin"))
    Always layer this on top of get_current_user — never trust a role
    claim without also having verified the token belongs to an active user.
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency


# ----- New helper dependencies for patient/doctor access -----
def get_current_patient(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != "patient":
        raise HTTPException(status_code=403, detail="Patient access required")
    return current_user


def get_current_doctor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Doctor access required")
    return current_user
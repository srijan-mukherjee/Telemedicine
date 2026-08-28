"""User self-service endpoints (profile management beyond this comes in later phases)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest
from app.services import auth_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.change_password(db, current_user, data.current_password, data.new_password)

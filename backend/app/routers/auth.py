"""
Auth endpoints.

Login accepts OAuth2PasswordRequestForm (standard `username` +
`password` form fields, with `username` used as the email) rather
than a JSON body. This is deliberate: it makes FastAPI's built-in
"Authorize" button in /docs work out of the box, which is a big
quality-of-life win for a project meant to stay beginner-friendly.
"""

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import RegisterDoctorRequest, RegisterPatientRequest, TokenResponse
from app.schemas.user import UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/patient", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_patient(data: RegisterPatientRequest, db: Session = Depends(get_db)):
    return auth_service.register_patient(db, data)


@router.post("/register/doctor", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_doctor(data: RegisterDoctorRequest, db: Session = Depends(get_db)):
    """
    Creates the doctor account with DoctorProfile.status = 'pending'.
    The account cannot be found in doctor search / booking flows
    until an Admin approves it (Phase 8).
    """
    return auth_service.register_doctor(db, data)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, email=form_data.username, password=form_data.password)
    token = auth_service.issue_token_for(user)
    return TokenResponse(access_token=token, role=user.role.value)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

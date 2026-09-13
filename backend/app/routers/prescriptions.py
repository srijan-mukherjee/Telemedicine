from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import Response as FastResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut, PrescriptionUpdate
from app.services import prescription_service, prescription_pdf

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("/appointment/{appointment_id}", response_model=PrescriptionOut,
             status_code=status.HTTP_201_CREATED)
def create_prescription(
    appointment_id: int,
    data: PrescriptionCreate,
    current_user: User = Depends(require_roles("doctor")),
    db: Session = Depends(get_db),
):
    return prescription_service.create_for_appointment(db, appointment_id, current_user, data)


@router.put("/appointment/{appointment_id}", response_model=PrescriptionOut)
def update_prescription(
    appointment_id: int,
    data: PrescriptionUpdate,
    current_user: User = Depends(require_roles("doctor")),
    db: Session = Depends(get_db),
):
    return prescription_service.update_for_appointment(db, appointment_id, current_user, data)


@router.get("/appointment/{appointment_id}", response_model=PrescriptionOut)
def get_prescription(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return prescription_service.get_for_appointment(db, appointment_id, current_user)


@router.get("/me", response_model=list[PrescriptionOut])
def list_my_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return prescription_service.list_for_user(db, current_user)


@router.get("/appointment/{appointment_id}/pdf")
def download_pdf(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rx = prescription_service.get_for_appointment(db, appointment_id, current_user)
    doctor_name = rx.appointment.doctor.full_name if rx.appointment.doctor else "Doctor"
    patient_name = rx.appointment.patient.full_name if rx.appointment.patient else "Patient"

    pdf_bytes = prescription_pdf.render_prescription_pdf(rx, doctor_name, patient_name)

    return FastResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": prescription_pdf.pdf_response_filename(rx),
        },
    )

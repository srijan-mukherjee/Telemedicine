"""
Import every model here so:
1. Alembic's `env.py` sees them via `from app.models import *` for autogenerate.
2. String-based relationship() references (e.g. "PatientProfile") resolve
   correctly, regardless of which module imports Base first.
"""

from app.models.user import User  # noqa: F401
from app.models.patient_profile import PatientProfile  # noqa: F401
from app.models.doctor_profile import DoctorProfile  # noqa: F401
from app.models.doctor_availability import DoctorAvailability  # noqa: F401
from app.models.specialty import Specialty  # noqa: F401
from app.models.prescription import Prescription, PrescriptionItem

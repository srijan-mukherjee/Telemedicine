"""
Seed script - run manually after migrations, not on every app startup.

Usage:
    cd backend && python -m app.database.seed

Creates:
- 1 admin account
- Starter specialties
- 5 approved sample doctors with recurring availability
- 3 sample patients

Safe to re-run: skips anything that already exists.
"""

from datetime import time

from app.core.security import hash_password
from app.database.base import Base
from app.database.session import SessionLocal, engine
from app.models.doctor_availability import DoctorAvailability
from app.models.doctor_profile import DoctorProfile
from app.models.enums import DoctorStatus, UserRole
from app.models.patient_profile import PatientProfile
from app.models.specialty import Specialty
from app.models.user import User

SPECIALTIES = [
    ("General Medicine", "Primary care and general checkups"),
    ("Cardiology", "Heart and cardiovascular conditions"),
    ("Dermatology", "Skin, hair, and nail conditions"),
    ("Pediatrics", "Care for infants, children, and adolescents"),
    ("Orthopedics", "Bones, joints, and muscles"),
]

ADMIN_EMAIL = "admin@telemedicine.local"
ADMIN_PASSWORD = "ChangeMe123!"  # change immediately after first login
SAMPLE_PASSWORD = "ChangeMe123!"

SAMPLE_DOCTORS = [
    {
        "email": "dr.asha@telemedicine.local",
        "full_name": "Asha Rao",
        "specialty": "General Medicine",
        "qualification": "MBBS, MD",
        "years_experience": 12,
        "clinic_address": "Wellness Clinic, Main Road",
        "consultation_fee": 600,
        "bio": "Primary care physician focused on preventive health.",
    },
    {
        "email": "dr.vikram@telemedicine.local",
        "full_name": "Vikram Mehta",
        "specialty": "Cardiology",
        "qualification": "MBBS, DM Cardiology",
        "years_experience": 15,
        "clinic_address": "Heart Care Centre",
        "consultation_fee": 1000,
        "bio": "Cardiologist for hypertension, chest discomfort, and follow-ups.",
    },
    {
        "email": "dr.neha@telemedicine.local",
        "full_name": "Neha Kapoor",
        "specialty": "Dermatology",
        "qualification": "MBBS, DDVL",
        "years_experience": 9,
        "clinic_address": "Skin Health Studio",
        "consultation_fee": 750,
        "bio": "Dermatology care for skin, hair, and nail concerns.",
    },
    {
        "email": "dr.arjun@telemedicine.local",
        "full_name": "Arjun Nair",
        "specialty": "Pediatrics",
        "qualification": "MBBS, DCH",
        "years_experience": 11,
        "clinic_address": "Child Care Clinic",
        "consultation_fee": 650,
        "bio": "Pediatrician for routine and urgent child health concerns.",
    },
    {
        "email": "dr.meera@telemedicine.local",
        "full_name": "Meera Iyer",
        "specialty": "Orthopedics",
        "qualification": "MBBS, MS Ortho",
        "years_experience": 14,
        "clinic_address": "Mobility Orthopedic Centre",
        "consultation_fee": 900,
        "bio": "Orthopedic care for bones, joints, and sports injuries.",
    },
]

SAMPLE_PATIENTS = [
    ("patient.one@telemedicine.local", "Patient One"),
    ("patient.two@telemedicine.local", "Patient Two"),
    ("patient.three@telemedicine.local", "Patient Three"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == ADMIN_EMAIL).first():
            admin = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                role=UserRole.admin,
                full_name="Platform Admin",
                is_active=True,
            )
            db.add(admin)
            print(f"Created admin: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            print("Admin already exists, skipping.")

        for name, description in SPECIALTIES:
            if not db.query(Specialty).filter(Specialty.name == name).first():
                db.add(Specialty(name=name, description=description, is_active=True))
                print(f"Created specialty: {name}")

        db.commit()
        specialties = {specialty.name: specialty for specialty in db.query(Specialty).all()}

        for doctor_data in SAMPLE_DOCTORS:
            user = db.query(User).filter(User.email == doctor_data["email"]).first()
            if not user:
                user = User(
                    email=doctor_data["email"],
                    password_hash=hash_password(SAMPLE_PASSWORD),
                    role=UserRole.doctor,
                    full_name=doctor_data["full_name"],
                    is_active=True,
                )
                db.add(user)
                db.flush()
                print(f"Created sample doctor: {doctor_data['email']} / {SAMPLE_PASSWORD}")

            profile = user.doctor_profile
            if not profile:
                profile = DoctorProfile(
                    user_id=user.id,
                    specialty_id=specialties[doctor_data["specialty"]].id,
                    qualification=doctor_data["qualification"],
                    years_experience=doctor_data["years_experience"],
                    clinic_address=doctor_data["clinic_address"],
                    consultation_fee=doctor_data["consultation_fee"],
                    bio=doctor_data["bio"],
                    status=DoctorStatus.approved,
                )
                db.add(profile)
                db.flush()
            else:
                profile.status = DoctorStatus.approved

            existing_availability = (
                db.query(DoctorAvailability).filter(DoctorAvailability.doctor_id == profile.id).first()
            )
            if not existing_availability:
                for day_of_week in range(0, 5):
                    db.add(
                        DoctorAvailability(
                            doctor_id=profile.id,
                            day_of_week=day_of_week,
                            start_time=time(9, 0),
                            end_time=time(12, 0),
                            is_recurring=True,
                            is_holiday=False,
                        )
                    )
                print(f"Created weekday availability for {doctor_data['full_name']}")

        for email, full_name in SAMPLE_PATIENTS:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    password_hash=hash_password(SAMPLE_PASSWORD),
                    role=UserRole.patient,
                    full_name=full_name,
                    is_active=True,
                )
                db.add(user)
                db.flush()
                db.add(PatientProfile(user_id=user.id))
                print(f"Created sample patient: {email} / {SAMPLE_PASSWORD}")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    _ = Base, engine
    seed()

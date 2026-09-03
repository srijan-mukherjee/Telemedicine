"""
Seed script - run manually after migrations, not on every app startup.

Usage:
    cd backend && python -m app.database.seed

Creates:
- 1 admin account
- Starter specialties
- Expanded approved sample doctors with recurring availability (Morning & Evening shifts)
- Expanded sample patients with profile demographics (Age, Blood Group, Phone)

Safe to re-run: skips anything that already exists.
"""

from datetime import time, date
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
        "full_name": "Dr. Asha Rao",
        "specialty": "General Medicine",
        "qualification": "MBBS, MD",
        "years_experience": 12,
        "clinic_address": "Wellness Clinic, Main Road, Block A",
        "consultation_fee": 600,
        "bio": "Primary care physician focused on preventive health, lifestyle disorders, and general wellness.",
        "shift": "morning", # 09:00 - 13:00
    },
    {
        "email": "dr.vikram@telemedicine.local",
        "full_name": "Dr. Vikram Mehta",
        "specialty": "Cardiology",
        "qualification": "MBBS, DM Cardiology",
        "years_experience": 15,
        "clinic_address": "Heart Care Centre, City Hospital Complex",
        "consultation_fee": 1200,
        "bio": "Senior cardiologist specializing in hypertension, arrhythmias, and post-infarction care.",
        "shift": "evening", # 16:00 - 20:00
    },
    {
        "email": "dr.neha@telemedicine.local",
        "full_name": "Dr. Neha Kapoor",
        "specialty": "Dermatology",
        "qualification": "MBBS, DDVL",
        "years_experience": 9,
        "clinic_address": "Skin Health Studio, Central Avenue",
        "consultation_fee": 800,
        "bio": "Expert dermatological care for chronic eczema, acne management, and cosmetic concerns.",
        "shift": "morning",
    },
    {
        "email": "dr.arjun@telemedicine.local",
        "full_name": "Dr. Arjun Nair",
        "specialty": "Pediatrics",
        "qualification": "MBBS, DCH",
        "years_experience": 11,
        "clinic_address": "Child Care Clinic, Sunshine Street",
        "consultation_fee": 650,
        "bio": "Dedicated pediatrician providing routine vaccinations, neonatal care, and child wellness evaluations.",
        "shift": "morning",
    },
    {
        "email": "dr.meera@telemedicine.local",
        "full_name": "Dr. Meera Iyer",
        "specialty": "Orthopedics",
        "qualification": "MBBS, MS Ortho",
        "years_experience": 14,
        "clinic_address": "Mobility Orthopedic Centre, Ring Road",
        "consultation_fee": 1000,
        "bio": "Orthopedic surgeon specializing in joint replacements, sports injuries, and spinal alignment.",
        "shift": "evening",
    },
    {
        "email": "dr.rohit@telemedicine.local",
        "full_name": "Dr. Rohit Verma",
        "specialty": "General Medicine",
        "qualification": "MBBS, MRCP (UK)",
        "years_experience": 8,
        "clinic_address": "City MediCare, Sector 4",
        "consultation_fee": 700,
        "bio": "Focuses on acute infections, metabolic syndromes, and chronic illness management.",
        "shift": "evening",
    },
]

SAMPLE_PATIENTS = [
    {
        "email": "patient.one@telemedicine.local",
        "full_name": "Rahul Sharma",
        "dob": date(1995, 4, 12),
        "blood_group": "O+",
        "phone": "+919876543210"
    },
    {
        "email": "patient.two@telemedicine.local",
        "full_name": "Priya Sen",
        "dob": date(1998, 9, 24),
        "blood_group": "B+",
        "phone": "+919876543211"
    },
    {
        "email": "patient.three@telemedicine.local",
        "full_name": "Amit Chatterjee",
        "dob": date(1985, 2, 15),
        "blood_group": "A+",
        "phone": "+919876543212"
    },
    {
        "email": "patient.four@telemedicine.local",
        "full_name": "Sneha Mukherjee",
        "dob": date(2001, 11, 5),
        "blood_group": "AB+",
        "phone": "+919876543213"
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        # 1. Admin seeding
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

        # 2. Specialties seeding
        for name, description in SPECIALTIES:
            if not db.query(Specialty).filter(Specialty.name == name).first():
                db.add(Specialty(name=name, description=description, is_active=True))
                print(f"Created specialty: {name}")

        db.commit()
        specialties = {specialty.name: specialty for specialty in db.query(Specialty).all()}

        # 3. Doctors seeding
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
                start_t = time(9, 0) if doctor_data["shift"] == "morning" else time(16, 0)
                end_t = time(13, 0) if doctor_data["shift"] == "morning" else time(20, 0)

                for day_of_week in range(0, 5):  # Monday to Friday
                    db.add(
                        DoctorAvailability(
                            doctor_id=profile.id,
                            day_of_week=day_of_week,
                            start_time=start_t,
                            end_time=end_t,
                            is_recurring=True,
                            is_holiday=False,
                        )
                    )
                print(f"Created {doctor_data['shift']} shift availability for {doctor_data['full_name']}")

        # 4. Patients seeding
        for patient_data in SAMPLE_PATIENTS:
            user = db.query(User).filter(User.email == patient_data["email"]).first()
            if not user:
                user = User(
                    email=patient_data["email"],
                    password_hash=hash_password(SAMPLE_PASSWORD),
                    role=UserRole.patient,
                    full_name=patient_data["full_name"],
                    phone=patient_data["phone"],
                    is_active=True,
                )
                db.add(user)
                db.flush()
                db.add(
                    PatientProfile(
                        user_id=user.id,
                        date_of_birth=patient_data["dob"],
                        blood_group=patient_data["blood_group"]
                    )
                )
                print(f"Created sample patient: {patient_data['email']} / {SAMPLE_PASSWORD}")

        db.commit()
        print("Database seed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    _ = Base, engine
    seed()
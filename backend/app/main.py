"""
FastAPI application entrypoint.

Phase 2 adds auth, users, and specialties routers on top of the
Phase 1 health check. Appointments/prescriptions/AI routers are
added in later phases.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, availability, doctors, health, specialties, users
from app.routers import appointments
from app.routers import appointments, auth, availability, doctors, health, specialties, users
from app.routers import doctor_panel          # ← add
from app.routers import auth, availability, doctors, health, specialties, users, prescriptions




settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)
app.include_router(specialties.router, prefix=settings.api_v1_prefix)
app.include_router(doctors.router, prefix=settings.api_v1_prefix)
app.include_router(availability.router, prefix=settings.api_v1_prefix)
app.include_router(appointments.router, prefix=settings.api_v1_prefix)
app.include_router(doctor_panel.router, prefix=settings.api_v1_prefix)  
app.include_router(prescriptions.router, prefix=settings.api_v1_prefix)



@app.get("/")
def root() -> dict:
    return {"message": f"{settings.app_name} API is running"}

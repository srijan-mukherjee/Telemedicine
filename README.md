# Smart Patient–Doctor Telemedicine Platform

Full-stack telemedicine platform (React + Vite frontend, FastAPI + PostgreSQL
backend). Built incrementally, phase by phase, per `docs/PHASE_LOG.md`.

## Current status: Phase 6 — Doctor panel & availability management

What exists right now:

- Phase 1 foundation (FastAPI + Vite booting, health checks)
- Phase 2: `users`, `patient_profiles`, `doctor_profiles`, `specialties`
  tables; JWT auth (bcrypt), role-based access control, patient/doctor
  self-registration (doctors start as `pending` until admin approval —
  approval UI lands in Phase 8), change-password self-service
- Phase 3: doctor profiles, availability model + service with dynamic
  30-minute slot generation, specialties browsing
- Phase 4: patient appointment booking — pick doctor → pick date → pick
  a generated slot; `PENDING` appointments with reference numbers;
  patient confirm/cancel with ownership and timing rules
- Phase 5: patient dashboard — my appointments, upcoming/past view,
  cancel, doctor search & booking flow end-to-end
- Phase 6: doctor panel —
  - Today's appointments with live stats and per-status filter tabs
  - Doctor-driven status transitions (single transition map in the
    service layer): `PENDING → CONFIRMED → WAITING → IN_CONSULTATION →
    COMPLETED`, plus cancel from `PENDING`/`CONFIRMED`; illegal jumps
    are rejected with `409`
  - "My Patients" list (distinct patients with age/blood group)
  - Authorized patient history — a doctor can only ever see
    appointments between that patient and themselves (`404` otherwise)
  - Availability management UI — add/remove recurring weekly windows,
    one-off date windows, and holidays; the patient slot picker
    reflects changes immediately

Not yet implemented (later phases): prescriptions/consultation records,
notifications & reminders, analytics, AI/RAG triage, admin doctor
approval UI (Phase 8), global UI polish/styling pass. See
`docs/PHASE_LOG.md`.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ running locally (or reachable via `DATABASE_URL`)

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL to point at your Postgres instance,
# e.g. postgresql+psycopg://postgres:postgres@localhost:5432/telemedicine
# also set SECRET_KEY to a long random string

# create the Postgres database itself (once), e.g.:
#   createdb telemedicine

# apply all migrations (users, profiles, specialties, appointments, availability)
alembic upgrade head

# optional: seed 1 admin account + starter specialties
python -m app.database.seed

uvicorn app.main:app --reload --port 8000
```

Visit:
- `http://localhost:8000/` — root message
- `http://localhost:8000/api/v1/health` — liveness check
- `http://localhost:8000/api/v1/health/db` — confirms DB connectivity
- `http://localhost:8000/docs` — interactive OpenAPI docs (use the
  "Authorize" button with the admin credentials printed by the seed
  script to try RBAC-protected endpoints)

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` and log in. Roles land on their own
dashboards: patient (search/book appointments), doctor (panel with
today's schedule, patients, availability), admin (placeholder until
Phase 8).

## Alembic

```bash
cd backend
alembic upgrade head                                     # apply migrations
alembic revision --autogenerate -m "describe change"     # for future phases
```

> **Note on migration `0001`:** this sandbox had no reachable Postgres
> instance to run `alembic revision --autogenerate` against, so that
> migration was written by hand against the SQLAlchemy models (and the
> models themselves were validated end-to-end against SQLite as a
> stand-in). Later migrations (appointments, availability) follow the
> same pattern. Run `alembic upgrade head` against your real Postgres
> and confirm the resulting schema before building on top of it.

---

## API map (all under `/api/v1`)

| Area | Endpoints |
|---|---|
| Health | `GET /health`, `GET /health/db` |
| Auth | `POST /auth/register/patient`, `POST /auth/register/doctor`, `POST /auth/login`, `GET /auth/me` |
| Users | `POST /users/change-password` |
| Specialties | public read, admin-only write |
| Doctors | doctor search/list (approved only) |
| Availability (doctor) | `GET/POST /availability/me`, `DELETE /availability/me/{id}` |
| Availability (patient) | `GET /availability/doctors/{doctor_id}/slots?date=YYYY-MM-DD` |
| Appointments | `POST /appointments`, `PUT /appointments/{id}/confirm`, `PUT /appointments/{id}/cancel`, `GET /appointments/me` |
| Doctor panel | `GET /doctor-panel/today`, `GET /doctor-panel/appointments`, `PATCH /doctor-panel/appointments/{id}/status`, `GET /doctor-panel/stats/today`, `GET /doctor-panel/patients`, `GET /doctor-panel/patients/{id}/history` |

Routers stay thin — all business rules (transition map, booking rules,
slot generation, authorization checks) live in `app/services/`.

---

## Project structure

```text
telemedicine-platform/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router registration
│   │   ├── core/
│   │   │   ├── config.py      # env-based Settings (pydantic-settings)
│   │   │   └── dependencies.py  # JWT auth, require_roles, get_current_*
│   │   ├── database/
│   │   │   ├── session.py     # engine, SessionLocal, get_db()
│   │   │   ├── base.py        # shared SQLAlchemy declarative Base
│   │   │   └── seed.py        # admin account + starter specialties
│   │   ├── models/            # User, PatientProfile, DoctorProfile,
│   │   │                      #   Specialty, Appointment, availability, enums
│   │   ├── schemas/           # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── health.py        # /health, /health/db
│   │   │   ├── auth.py          # register/patient, register/doctor, login, me
│   │   │   ├── users.py         # change-password
│   │   │   ├── specialties.py   # public read, admin-only write
│   │   │   ├── doctors.py       # doctor search/profile
│   │   │   ├── availability.py  # doctor CRUD + public slot generation
│   │   │   ├── appointments.py  # book/confirm/cancel/me
│   │   │   └── doctor_panel.py  # today, listing, status, patients, history
│   │   ├── services/
│   │   │   ├── auth_service.py          # registration/login/password logic
│   │   │   ├── availability_service.py  # windows + 30-min slot generation
│   │   │   ├── appointment_service.py   # booking rules, patient transitions
│   │   │   ├── doctor_service.py        # doctor profile helpers
│   │   │   └── doctor_panel_service.py  # transition map, stats, patients
│   │   ├── repositories/user_repository.py
│   │   ├── ai/                # empty — later phase (RAG/triage)
│   │   └── tasks/             # empty — background jobs (reminders, expiry)
│   ├── alembic/versions/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── main.jsx, App.jsx           # role-based routing
│       ├── pages/                      # Login, Register, role dashboards,
│       │                               #   patient booking flow (doctor →
│       │                               #   date → slot)
│       ├── context/AuthContext.jsx     # session state, validates via /auth/me
│       ├── components/
│       │   ├── ProtectedRoute.jsx, TopBar.jsx
│       │   ├── ChangePasswordPanel.jsx
│       │   ├── AppointmentCard.jsx, StatusBadge.jsx
│       │   └── AvailabilityPanel.jsx   # doctor availability management UI
│       ├── services/
│       │   ├── api.js                  # JWT-aware fetch wrapper (GET/POST/
│       │   │                           #   POST form/PATCH/DELETE, 401 handling)
│       │   ├── authService.js
│       │   └── doctorPanelService.js   # doctor panel + availability calls
│       └── layouts/ hooks/ utils/ styles/   # minimal — polish phase
├── docs/
│   └── PHASE_LOG.md
└── README.md
```

## Engineering rules this project follows

- No business logic in route files — routers stay thin, logic goes in `services/`
- Backend never trusts frontend-supplied role/auth data
- Cross-role data access is always scoped server-side (e.g., patient
  history is filtered by the requesting doctor's own appointments)
- Passwords are always hashed (bcrypt, from Phase 2)
- Secrets live in `.env`, never in source
- Each phase must leave the app runnable end-to-end

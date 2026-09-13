# Phase Log

## Phase 1 — Project Foundation ✅ (this delivery)

**Goal:** a runnable skeleton, nothing more.

Implemented:
- Repository structure (backend + frontend + docs)
- FastAPI app (`app/main.py`) with CORS and a health router
- `app/core/config.py` — typed settings loaded from `.env`
- `app/database/session.py` + `app/database/base.py` — SQLAlchemy
  engine, session dependency, shared declarative Base
- Alembic initialized and wired to `Settings.database_url` (no
  migrations yet — nothing to migrate until Phase 2 adds models)
- React + Vite frontend that calls `/api/v1/health` on load and
  displays connectivity status
- Verified: backend imports cleanly and its routes register;
  frontend `npm run build` succeeds

Explicitly deferred (per spec — "do not build every feature at once"):
- No auth, no users table, no roles yet
- No appointments, prescriptions, AI/RAG, notifications, analytics
- No seed data yet (needs the Users/Doctors/Specialties tables from
  Phase 2 first)

## Phase 2 — Database + Authentication ✅ (this delivery)

Implemented:
- Models: `User`, `PatientProfile`, `DoctorProfile`, `Specialty`
  (`app/models/`), with shared `UserRole` / `DoctorStatus` enums
- Alembic migration `0001_users_profiles_specialties.py` creating all
  four tables + Postgres enum types (hand-written and reviewed line
  by line against the models — this sandbox has no Postgres, so it
  could not be run through `alembic revision --autogenerate`; **run
  and sanity-check it against your real DB before trusting it**)
- `app/core/security.py` — bcrypt password hashing (direct `bcrypt`
  lib, not passlib, to sidestep a known passlib/bcrypt 4.1+
  incompatibility), JWT issue/verify via `pyjwt`
- `app/core/dependencies.py` — `get_current_user` (decodes JWT,
  re-checks the user is still active in the DB) and `require_roles(...)`
  for per-route RBAC
- Endpoints: `POST /auth/register/patient`, `POST /auth/register/doctor`
  (creates the account with `doctor_profile.status = pending`),
  `POST /auth/login` (OAuth2 form so Swagger's Authorize button works),
  `GET /auth/me`, `POST /users/me/change-password`,
  `GET/POST /specialties` (POST is admin-only — first RBAC-protected write)
- `app/database/seed.py` — creates 1 admin account + 5 specialties
- Frontend: `AuthContext` (validates any stored token against
  `/auth/me` on load rather than trusting it blindly), `ProtectedRoute`
  (role-gated, redirects to `/login` or the user's own dashboard —
  a UX convenience only; the backend is the real authorization boundary),
  `LoginPage`, `RegisterPage` (patient/doctor toggle, doctor form pulls
  live specialty list), placeholder `PatientDashboardPage` /
  `DoctorDashboardPage` / `AdminDashboardPage`, and dashboard
  change-password self-service

Hardening added:
- Malformed JWT `sub` claims now return 401 instead of crashing during
  user lookup
- Passwords over bcrypt's 72-byte limit now return 400 during
  registration/change-password instead of surfacing as server errors

Verified in-sandbox (SQLite standing in for Postgres, since no Postgres
was reachable here): full register → login → `/auth/me` → RBAC-403 →
change-password → re-login flow, all passing. Frontend `npm run build`
succeeds.

Deferred to later phases: doctor approval UI (Phase 8), appointments,
prescriptions, AI/RAG, notifications, analytics.

## Phase 3 — Doctors + Availability ✅ (this delivery)

Implemented:
- Doctor profiles: own-profile access for doctors
  (`get_own_doctor_profile`) and a public doctor search that exposes
  approved doctors only
- `DoctorAvailability` model — three shapes in one table: recurring
  weekly windows (`day_of_week`, 0 = Monday, matching Python's
  `date.weekday()`), date-specific one-off windows (`specific_date`),
  and holidays (`is_holiday` + `specific_date`)
- `availability_service` with full validation: windows require
  start/end times with start < end; recurring windows require
  `day_of_week` and cannot also carry a date; date-specific windows
  require `specific_date`; holidays must be date-specific; duplicate
  recurring windows are rejected
- Dynamic 30-minute slot generation (`generate_slots`) — computed on
  demand, no pre-created slot rows (per spec section 6); excludes
  holidays and already-booked times
- Endpoints: `GET/POST /availability/me`,
  `DELETE /availability/me/{id}` (doctor-only),
  `GET /availability/doctors/{doctor_id}/slots?date=` (public)

Deferred to Phase 4: turning generated slots into bookings.

## Phase 4 — Appointment Booking ✅ (this delivery)

Implemented:
- `Appointment` model + Alembic migration: patient/doctor FKs,
  `appointment_datetime`, `reason_text`, status enum (`PENDING`,
  `CONFIRMED`, `WAITING`, `IN_CONSULTATION`, `COMPLETED`,
  `CANCELLED`), unique `reference_number`, `booked_at`
- `POST /appointments` — patient-only; validates the requested time
  against the doctor's generated availability and stores it; errors
  surface as `400`
- `PUT /appointments/{id}/confirm` and `/cancel` — patient-only,
  ownership + timing rules enforced in the service layer
- `GET /appointments/me` — role-aware listing (patient sees own
  bookings, doctor sees own schedule)

Deferred to Phase 5: the patient-facing booking UI flow.

## Phase 5 — Patient Dashboard & Booking Flow ✅ (this delivery)

Implemented:
- Patient dashboard: my appointments with upcoming/past view,
  appointment cards with status badges and reference numbers,
  cancel with ownership checks
- End-to-end booking flow: search doctor → pick date → pick a
  generated 30-minute slot (slot picker reads
  `/availability/doctors/{id}/slots`) → book
- Frontend services layer extended per domain on top of the JWT-aware
  `api.js` wrapper

Deferred to Phase 6: the doctor-side panel.

## Phase 6 — Doctor Panel & Availability Management ✅ (this delivery)

Implemented:
- Doctor dashboard: today's appointments with live per-status counts
  (`/doctor-panel/stats/today`) and per-status filter tabs
- Doctor-driven status transitions with a single transition map in
  `doctor_panel_service`: `PENDING → CONFIRMED → WAITING →
  IN_CONSULTATION → COMPLETED`, plus cancel from `PENDING`/`CONFIRMED`
  (appends a "[Cancelled by doctor]" note); illegal jumps rejected
  with `409`
- "My Patients": distinct patients who booked with this doctor, with
  age/blood group from their profiles
- Authorized patient history: scoped server-side to appointments
  between the requesting doctor and that patient — any other patient
  id returns `404`
- Availability management UI (`AvailabilityPanel`): add/delete
  recurring weekly windows, one-off date windows, and holidays;
  backend validation errors shown inline; the patient slot picker
  reflects changes immediately

Hardening added:
- `apiDelete` added to the frontend fetch wrapper (204-aware)
- Confirmed `day_of_week` uses the `weekday()` convention (0 = Monday)
  consistently from form → schema → slot generation

Verified end-to-end in the browser: full status transition flow,
`409` on illegal transition, history `404` negative test, patients
list, and availability CRUD reflected in the patient slot picker.

## Phase 7: Prescriptions, PDF Generation & Medical History ✅ COMPLETE

**Goal:** Doctors write prescriptions during consultations; patients view/download them.

### Backend
- `prescriptions` table: one-to-one with appointments (unique `appointment_id`), FKs to doctor & patient
- `prescription_items` table: medicines (name, dosage, frequency, duration_days) linked to prescription
- Endpoints (all JWT-protected):
  - `POST /api/v1/prescriptions/appointment/{id}` — doctor only, own appointment, status must be IN_CONSULTATION or COMPLETED (else 409)
  - `PUT /api/v1/prescriptions/appointment/{id}` — full update (replace items), same rules
  - `GET /api/v1/prescriptions/appointment/{id}` — doctor (owner) or the appointment's patient only (404 otherwise — no info leak)
  - `GET /api/v1/prescriptions/me` — patient's own prescription list
  - `GET /api/v1/prescriptions/appointment/{id}/pdf` — PDF download (ReportLab), permission-checked
- PDF layout: clinic header, doctor/patient details, reference number, diagnosis, medicine table, advice, footer

### Frontend
- `PrescriptionForm.jsx` — create/edit medicines dynamically; switches to edit mode after save
- `PrescriptionView.jsx` — read-only prescription display + PDF download button
- `AppointmentCard.jsx` — role-aware: doctors get the form, patients get the view (role prop)
- Patient dashboard: "My Prescriptions" section with per-item PDF download
- `api.js`: added `apiPut`, exported `API_PREFIX`

### Verified
- ✅ Create prescription with multiple medicines (IN_CONSULTATION)
- ✅ Edit prescription; changes reflected in regenerated PDF
- ✅ Patient sees prescription in card + dashboard list; PDF downloads correctly
- ✅ 409 on PENDING appointment save attempt
- ✅ 404 cross-patient access to another patient's prescription

## Phase 8 — Admin Panel ✅

- Admin-only router (`/api/v1/admin/*`) protected via `require_roles("admin")`
- Doctor approval queue: list all doctors, approve / block / set pending
  (blocked doctors rejected at login with clear message)
- User management: list all users with appointment counts,
  activate / deactivate accounts (self-deactivation blocked)
- Appointments overview: all appointments with status / doctor / patient filters
- Analytics: user & doctor totals, appointments grouped by status
- Audit logging: every admin action recorded (`DOCTOR_APPROVED`, `DOCTOR_BLOCKED`,
  `USER_ACTIVATED`, `USER_DEACTIVATED`) with admin email, target and timestamp
- Frontend: `/admin` page with role-guarded route (AdminRoute) and tabs —
  Analytics, Users, Doctors, Audit Logs
- Backend: app/routers/admin.py
- Frontend: src/pages/AdminDashboard.jsx, src/components/AdminRoute.jsx

## Phase 9 — AI Symptom Checker + Find-a-Doctor Integration ✅

**Goal:** an AI triage assistant grounded in a curated knowledge base, with
hard safety guarantees and full integration into doctor discovery + booking.

### Backend
- `ai_conversations` + `ai_chat_messages` tables (per-patient, titled
  conversations; Alembic migration)
- Medical knowledge-base table with pgvector embedding column; seed script
  populates curated chunks (emergency signs, common conditions per specialty)
- `ai_chat_service.py`:
  - greeting detection (short pleasantries → friendly reply, no triage/LLM waste)
  - RAG: embed message → cosine top-k KB chunks → strict grounded prompt
  - Groq call → JSON parsed into `TriageResponse` (Pydantic-validated;
    specialty constrained to the 5 platform specialties or None; invalid
    output triggers one retry, then graceful fallback)
  - dual red-flag safety: regex pre-check (fast path, no LLM) + post-check
    that can only ESCALATE urgency; emergency responses are hardcoded,
    never LLM-generated
  - conversation persistence, history, ownership scoping (`404` on
    foreign conversation ids)
- Router: `POST /ai-chat`, `GET /ai-chat/conversations`,
  `GET /ai-chat/conversations/{id}`; doctor-suggestion engine
  (recommended specialty → General Medicine → any approved, rating-ranked,
  emergencies excluded — ER, not booking)

### Frontend
- `SymptomChecker.jsx`: chat UI with bubbles, urgency color banner
  (🚨🟠🔵🟢), suggested-doctor cards deep-linked to `/doctor/:id`
  (booking flow), sidebar conversation list + history restore, disclaimer

### Bugs found & fixed during integration (worth remembering)
- Duplicate `send_message` route definition shadowed the intended one
- Pydantic validators crashed on `None` specialty (greeting path) — added
  `None` guards; made `recommended_specialty` optional in **both**
  `TriageResponse` and `ChatResponse`
- Suggested-doctor `id` was `user_id` but `/doctor/:id` expects profile id —
  added `doctor_profile_id` to `SuggestedDoctor`, navigation fixed

### Status
All golden flows pass: greeting, rash → Dermatology + cards → correct
doctor → booking, chest pain → emergency, history restore.

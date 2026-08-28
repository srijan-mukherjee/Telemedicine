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

## Phase 3 — Doctors + Availability (next)

Planned: doctor profile editing, specialty filtering/search, recurring
availability + holiday/exception model, dynamic 30-minute slot
generation (no pre-created slot rows, per spec section 6).

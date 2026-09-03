# Smart Patient–Doctor Telemedicine Platform

Full-stack telemedicine platform — **React + Vite** frontend, **FastAPI + PostgreSQL**
backend — with an **AI-powered symptom checker (RAG + safety layers)** integrated
into the doctor discovery and booking flow. Built incrementally, phase by phase,
per `docs/PHASE_LOG.md`.

## Current status: Phase 9 — AI Symptom Checker + Find-a-Doctor integration ✅

## Features

### Auth & profiles
- JWT authentication (bcrypt-hashed passwords), role-based access control
- Patient self-registration; doctor registration → `PENDING` until admin approval
- Change-password self-service, `GET /auth/me` session validation

### Admin panel
- Doctor approval workflow (approve / reject pending applications)
- User management, platform analytics (appointments, doctors, patients)
- Complete audit trail of admin actions

### Doctor tools
- Today's dashboard with live stats and per-status filter tabs
- Status lifecycle: `PENDING → CONFIRMED → WAITING → IN_CONSULTATION → COMPLETED`
  (+ cancel from `PENDING`/`CONFIRMED`); illegal transitions rejected with `409`
- "My Patients" list and patient history (scoped: a doctor only ever sees
  appointments between that patient and themselves — `404` otherwise)
- Availability management UI — recurring weekly windows, one-off date windows,
  holidays; patient slot picker reflects changes immediately
- Prescriptions — create/edit multi-medicine prescriptions; patients view them
  and download **PDF prescriptions**

### Patient tools
- Doctor search (name / specialty), doctor profile pages with real-time
  30-minute slot generation
- Booking with double-booking prevention, reference numbers, my-appointments,
  confirm/cancel with ownership & timing rules
- **AI Symptom Checker** (see below) with one-click booking to suggested doctors

### Video consultations
- WebRTC room per appointment (join from appointment cards when consultation
  is active)

### AI Symptom Checker (Phase 9)
- **Safety-first triage:** deterministic regex red-flag scan runs *before* and
  *after* the LLM. Emergency signs (chest pain, stroke FAST signs, self-harm,
  severe bleeding, etc.) **always** escalate to a hardcoded emergency message —
  the model can never de-escalate an emergency
- **RAG:** patient message → pgvector semantic search over a curated medical
  knowledge base → strict context-grounded prompt
- **Structured output:** Groq LLM returns JSON validated by Pydantic —
  `urgency` ∈ {emergency, urgent, soon, routine}, `recommended_specialty`
  constrained to the platform's 5 specialties (or `None` for greetings)
- **Find-a-Doctor integration:** non-emergency responses include suggested
  approved doctors in the recommended specialty (fallback: General Medicine
  → any approved), ranked by rating, deep-linked into the real booking flow
- Conversation persistence per patient: titled conversation list + full history
- Every response carries a medical disclaimer — educational guidance, not a
  diagnosis; emergencies are always routed to emergency services, never to booking

## Prerequisites

- Python 3.11+, Node.js 18+, PostgreSQL 14+ **with the `pgvector` extension**
- A Groq API key (free) — https://console.groq.com

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/telemedicine
#   SECRET_KEY=<long random string>
#   GROQ_API_KEY=<your key>

createdb telemedicine            # once
psql -d telemedicine -c "CREATE EXTENSION IF NOT EXISTS vector;"

alembic upgrade head             # all migrations incl. conversations + knowledge base
python -m app.database.seed      # admin account + starter specialties + KB chunks

uvicorn app.main:app --reload --port 8000
```

- `http://localhost:8000/docs` — interactive OpenAPI docs
- `http://localhost:8000/api/v1/health` / `/health/db` — liveness checks

## Frontend setup

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

Roles land on their own dashboards: patient (search/book, symptom checker,
my appointments, prescriptions), doctor (panel + availability + prescriptions),
admin (approvals, users, analytics).

## API map (base: `/api/v1`)

| Area | Endpoints |
|---|---|
| Health | `GET /health`, `GET /health/db` |
| Auth | `POST /auth/register/patient`, `POST /auth/register/doctor`, `POST /auth/login`, `GET /auth/me` |
| Users | `POST /users/change-password` |
| Specialties | public read, admin-only write |
| Doctors | approved-only search/list, `GET /doctors/{id}` profile |
| Availability | doctor `GET/POST/DELETE /availability/me`; patient `GET /availability/doctors/{id}/slots?date=` |
| Appointments | `POST /appointments`, `GET /appointments/me`, `PUT .../confirm`, `PUT .../cancel`, `GET .../today`, `GET .../stats/today`, `GET .../patients`, `GET .../patients/{id}/history` |
| Prescriptions | `POST/PUT/GET /prescriptions/appointment/{id}`, `GET /prescriptions/me`, `GET .../pdf` |
| Admin | doctor approval, user management, analytics, audit logs |
| **AI chat** | `POST /ai-chat`, `GET /ai-chat/conversations`, `GET /ai-chat/conversations/{id}` |

Routers stay thin — all business rules (transition maps, booking rules, slot
generation, red-flag safety, authorization scoping) live in `app/services/`.

## AI Symptom Checker — how it works

```
patient message
   │
   ├─► regex red-flag scan ── emergency? ──► hardcoded ER message (no LLM)
   │
   ├─► pgvector retrieval (top-k KB chunks)
   ├─► Groq LLM (strict JSON prompt, grounded in retrieved context only)
   ├─► Pydantic validation (urgency enum, specialty whitelist; retry on failure)
   ├─► post-check: red flags can only ESCALATE urgency
   │
   └─► response: answer + urgency + specialty + red_flags + disclaimer
                    └─ non-emergency? ──► suggested approved doctors
                                            └─► /doctor/:id booking flow
```

Safety guarantees:
- The emergency path is **deterministic** — no LLM involved, cannot fail
- The LLM output is schema-validated; specialty hallucinations are rejected/retried
- Post-check can only raise urgency, never lower it
- 502 fail-safe response on any AI-layer failure; internals never exposed

## Project structure

```text
telemedicine-platform/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, router registration
│   │   ├── core/                    # config (pydantic-settings), dependencies (JWT/RBAC)
│   │   ├── database/                # session, base, seed (admin, specialties, KB)
│   │   ├── models/                  # User, profiles, Specialty, Appointment,
│   │   │                            #   availability, AIConversation, Message, KB chunk
│   │   ├── schemas/                 # Pydantic models incl. TriageResponse, ChatResponse
│   │   ├── routers/                 # health, auth, users, specialties, doctors,
│   │   │                            #   availability, appointments, doctor_panel,
│   │   │                            #   admin, prescriptions, ai_chat
│   │   ├── services/                # all business logic + ai_chat_service (RAG triage)
│   │   └── ai/                      # LLM client, embeddings, prompts
│   ├── alembic/versions/
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.jsx                  # role-based routing
│       ├── pages/                   # Login, Register, dashboards, DoctorsList,
│       │                            #   DoctorProfile (booking), MyAppointments,
│       │                            #   SymptomChecker, Admin/Doctor panels
│       ├── components/              # SlotPicker, BookingForm, ProtectedRoute,
│       │                            #   StatusBadge, AvailabilityPanel, ...
│       ├── context/AuthContext.jsx
│       └── services/                # api.js (JWT-aware), authService, aiChatService, ...
├── docs/PHASE_LOG.md
└── README.md
```

## Engineering rules

- No business logic in routers — logic lives in `services/`
- Backend never trusts frontend-supplied role/auth data
- Cross-role data access scoped server-side (doctor sees only own patients' history)
- Passwords hashed (bcrypt); secrets in `.env`, never in source
- AI is a **safety layer, not a boss** — deterministic checks always win over LLM output
- Each phase must leave the app runnable end-to-end

## Golden end-to-end flows (manual test script)

1. **Auth:** register patient → login → lands on patient dashboard
2. **Doctor onboarding:** register doctor → admin approves → doctor appears in search
3. **Booking:** search doctor → profile → date → slot → book → appears in
   My Appointments; doctor sees it on Today panel
4. **Consultation:** doctor transitions status → video room → prescription →
   patient downloads PDF
5. **AI triage:** symptom checker → rash → Dermatology + doctor cards →
   Book Appointment → correct doctor profile → book; chest pain → 🚨 emergency;
   greeting → no specialty/cards

## Roadmap (remaining)

- Notification & reminder jobs (`app/tasks/`)
- Analytics dashboards expansion
- Global UI polish / styling pass, responsive audit
- Deployment (Docker compose, hosted Postgres)

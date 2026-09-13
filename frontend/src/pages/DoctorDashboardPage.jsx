import { useCallback, useEffect, useState } from "react";
import ChangePasswordPanel from "../components/ChangePasswordPanel.jsx";
import TopBar from "../components/TopBar.jsx";
import AppointmentCard from "../components/AppointmentCard.jsx";
import AvailabilityPanel from "../components/AvailabilityPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchTodayAppointments,
  fetchDoctorPatients,
  fetchPatientHistory,
} from "../services/doctorPanelService";

const STATUS_TABS = [null, "PENDING", "CONFIRMED", "WAITING", "IN_CONSULTATION"];

const MICRO_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function doctorName(fullName) {
  return String(fullName || "").replace(/^dr\.?\s+/i, "").trim();
}

function initials(name) {
  const parts = String(name || "").replace(/^dr\.?\s+/i, "").trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "–";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const status = user.doctor_profile?.status;

  // today's appointments state
  const [today, setToday] = useState([]);
  const [filter, setFilter] = useState(null); // null = all statuses
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // tab state: "today" | "patients" | "availability"
  const [tab, setTab] = useState("today");

  // patients tab state
  const [patients, setPatients] = useState([]);
  const [historyFor, setHistoryFor] = useState(null); // patient id or null
  const [history, setHistory] = useState([]);

  async function openPatients() {
    setTab("patients");
    setHistoryFor(null);
    setError("");
    setLoading(true);
    try {
      setPatients(await fetchDoctorPatients());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(patientId) {
    setHistoryFor(patientId);
    setError("");
    try {
      setHistory(await fetchPatientHistory(patientId));
    } catch (e) {
      setError(e.message);
    }
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setToday(await fetchTodayAppointments());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!status || status === "approved") refresh();
  }, [status, refresh]);

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-[#f7f6f3]">
        <TopBar />
        <main className="mx-auto flex max-w-xl flex-col gap-5 px-6 py-16">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
            <p className={MICRO_LABEL}>Account status</p>
            <h1
              className="mt-2 text-3xl font-semibold tracking-tight text-stone-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome, Dr. {doctorName(user.full_name)}
            </h1>
            <p className="mx-auto mt-3 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
              Your account is pending admin approval. You&apos;ll appear in
              patient search once approved.
            </p>
          </div>
          <ChangePasswordPanel />
        </main>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="min-h-screen bg-[#f7f6f3]">
        <TopBar />
        <main className="mx-auto flex max-w-xl flex-col gap-5 px-6 py-16">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-8 text-center shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
            <p className={MICRO_LABEL}>Account status</p>
            <h1
              className="mt-2 text-3xl font-semibold tracking-tight text-stone-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome, Dr. {doctorName(user.full_name)}
            </h1>
            <p className="mx-auto mt-3 max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
              Your account has been blocked.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const visible = filter ? today.filter((a) => a.status === filter) : today;
  const countFor = (s) => (s ? today.filter((a) => a.status === s).length : today.length);
  const todayLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const profile = user.doctor_profile || {};
  const credentials = [profile.qualification, profile.years_experience != null ? `${profile.years_experience} yrs experience` : null]
    .filter(Boolean)
    .join("  ·  ");

  const TABS = [
    ["today", "Today"],
    ["patients", "Patients"],
    ["availability", "Availability"],
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* ── header ── */}
        <header className="flex flex-wrap items-end justify-between gap-4 pb-2 pt-10">
          <div>
            <p className={MICRO_LABEL}>
              {todayLabel} <span className="mx-2 text-stone-300">/</span> Doctor console
            </p>
            <h1
              className="mt-2 text-4xl font-semibold tracking-tight text-stone-900 sm:text-[2.75rem]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {greeting()}, Dr. {doctorName(user.full_name)}
            </h1>
            {credentials && (
              <p className="mt-2 text-sm text-stone-500">{credentials}</p>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-stone-200/80 bg-white py-1.5 pl-3 pr-4 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-700 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-700" />
            </span>
            <span className="text-[13px] font-medium tabular-nums text-stone-700">
              {today.length} appointment{today.length === 1 ? "" : "s"} today
            </span>
          </div>
        </header>

        {/* ── main tabs ── */}
        <nav className="mt-8 flex gap-7 border-b border-stone-200">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => {
                if (value === "patients") openPatients();
                else {
                  setTab(value);
                  setHistoryFor(null);
                }
              }}
              className={`-mb-px border-b-2 pb-3 text-sm font-medium transition ${
                tab === value
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ── error ── */}
        {error && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {/* ── loading skeleton ── */}
        {loading && tab !== "availability" && (
          <div className="mt-5 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200/60" />
            ))}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ================= TODAY TAB ================= */}
            {tab === "today" && (
              <section className="mt-5 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_TABS.map((s) => (
                    <button
                      key={s ?? "all"}
                      onClick={() => setFilter(s)}
                      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium tabular-nums transition ${
                        filter === s
                          ? "bg-stone-900 text-white shadow-sm"
                          : "border border-stone-300/80 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
                      }`}
                    >
                      {s ? s.replaceAll("_", " ").toLowerCase() : "All"}
                      <span className={filter === s ? "text-white/70" : "text-stone-400"}>
                        {"  "}{countFor(s)}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={refresh}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-stone-500 transition hover:bg-white hover:text-stone-900"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Refresh
                  </button>
                </div>

                {visible.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
                    <p className="text-sm font-medium text-stone-700">A clear schedule</p>
                    <p className="mt-1 text-[13px] text-stone-500">
                      No appointments{filter ? ` with status ${filter.replaceAll("_", " ").toLowerCase()}` : " today"}.
                    </p>
                  </div>
                ) : (
                  visible.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      role="doctor"
                      onUpdated={() => refresh()} // re-fetch so stats stay in sync
                      onError={(m) => setError(m)}
                    />
                  ))
                )}
              </section>
            )}

            {/* ================= PATIENTS TAB ================= */}
            {tab === "patients" && !historyFor && (
              <section className="mt-5 flex flex-col gap-2">
                <p className={MICRO_LABEL}>
                  My patients
                  <span className="ml-2 tabular-nums text-stone-400">{patients.length}</span>
                </p>
                {patients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
                    <p className="text-sm font-medium text-stone-700">No patients yet</p>
                    <p className="mt-1 text-[13px] text-stone-500">
                      Patients appear here after they book with you.
                    </p>
                  </div>
                ) : (
                  patients.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:shadow-[0_4px_16px_rgba(28,25,23,0.07)]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-800/10 text-[13px] font-semibold tracking-wide text-teal-900">
                        {initials(p.full_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-900">
                          {p.full_name}
                        </p>
                        <p className="truncate text-[13px] tabular-nums text-stone-500">
                          {[p.age != null ? `${p.age} yrs` : null, p.blood_group, p.email]
                            .filter(Boolean)
                            .join("  ·  ")}
                        </p>
                      </div>
                      <button
                        onClick={() => openHistory(p.id)}
                        className="shrink-0 rounded-lg border border-stone-300/80 bg-white px-3.5 py-2 text-[13px] font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
                      >
                        View history
                      </button>
                    </div>
                  ))
                )}
              </section>
            )}

            {tab === "patients" && historyFor && (
              <section className="mt-5 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setHistoryFor(null)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-stone-500 transition hover:bg-white hover:text-stone-900"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Patients
                  </button>
                  <p className={MICRO_LABEL}>
                    History
                    <span className="ml-2 tabular-nums text-stone-400">{history.length}</span>
                  </p>
                </div>

                {history.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
                    <p className="text-sm font-medium text-stone-700">Nothing here yet</p>
                    <p className="mt-1 text-[13px] text-stone-500">
                      No appointments found for this patient.
                    </p>
                  </div>
                ) : (
                  history.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      role="doctor"
                      onUpdated={() => openHistory(historyFor)} // keep history fresh after actions
                      onError={(m) => setError(m)}
                    />
                  ))
                )}
              </section>
            )}

            {/* ================= AVAILABILITY TAB ================= */}
            {tab === "availability" && (
              <section className="mt-5">
                <AvailabilityPanel onError={(m) => setError(m)} />
              </section>
            )}
          </>
        )}

        {/* ── security ── */}
        <div className="mt-12 border-t border-stone-200 pt-6">
          <p className={MICRO_LABEL}>Security</p>
          <ChangePasswordPanel />
        </div>
      </main>
    </div>
  );
}

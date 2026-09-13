import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import ChangePasswordPanel from "../components/ChangePasswordPanel.jsx";
import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchMyPrescriptions, downloadPrescriptionPdf } from "../services/doctorPanelService";

const MICRO_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rxList, setRxList] = useState([]);
  const [rxError, setRxError] = useState("");

  useEffect(() => {
    fetchMyPrescriptions()
      .then(setRxList)
      .catch((e) => setRxError(e.message));
  }, []);

  const todayLabel = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const firstName = String(user?.full_name || "there").split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* ── header ── */}
        <header className="pb-2 pt-10">
          <p className={MICRO_LABEL}>
            {todayLabel} <span className="mx-2 text-stone-300">/</span> Patient console
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-stone-900 sm:text-[2.75rem]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {greeting()}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Your health, appointments and prescriptions — in one calm place.
          </p>
        </header>

        {/* ── quick actions ── */}
        <section className="mt-8 grid gap-3 md:grid-cols-3">
          <button
            onClick={() => navigate("/symptom-checker")}
            className="group rounded-2xl bg-stone-900 p-6 text-left shadow-[0_1px_2px_rgba(28,25,23,0.1)] transition hover:bg-stone-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition group-hover:bg-white/15">
              <svg className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18.75 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L22.5 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </span>
            <p className="mt-4 text-[15px] font-semibold text-white">AI Symptom Checker</p>
            <p className="mt-1 text-[13px] leading-relaxed text-stone-400">
              Describe your symptoms and get instant triage guidance.
            </p>
          </button>

          {[
            ["Find a doctor", "Search specialists and book a visit.", "/doctors"],
            ["My appointments", "Upcoming visits and consultation history.", "/my-appointments"],
          ].map(([title, sub, to]) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition hover:shadow-[0_4px_16px_rgba(28,25,23,0.07)]"
            >
              <p className="text-[15px] font-semibold text-stone-900">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-500">{sub}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-teal-800 transition group-hover:gap-2">
                Open
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </p>
            </Link>
          ))}
        </section>

        {/* ── prescriptions ── */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <p className={MICRO_LABEL}>
              Prescriptions
              {rxList.length > 0 && (
                <span className="ml-2 tabular-nums text-stone-400">{rxList.length}</span>
              )}
            </p>
          </div>

          {rxError && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {rxError}
            </p>
          )}

          {rxList.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
              <p className="text-sm font-medium text-stone-700">No prescriptions yet</p>
              <p className="mt-1 text-[13px] text-stone-500">
                Prescriptions from your consultations will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {rxList.map((rx) => (
                <div
                  key={rx.id}
                  className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:shadow-[0_4px_16px_rgba(28,25,23,0.07)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-800/10 text-[13px] font-semibold text-teal-900">
                    Rx
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {rx.diagnosis || "No diagnosis recorded"}
                    </p>
                    <p className="truncate text-[13px] tabular-nums text-stone-500">
                      {new Date(rx.created_at).toLocaleDateString()} · {rx.items?.length || 0} medicine{(rx.items?.length || 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadPrescriptionPdf(rx.appointment_id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-300/80 bg-white px-3.5 py-2 text-[13px] font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── security ── */}
        <div className="mt-12 border-t border-stone-200 pt-6">
          <p className={MICRO_LABEL}>Security</p>
          <ChangePasswordPanel />
        </div>
      </main>
    </div>
  );
}

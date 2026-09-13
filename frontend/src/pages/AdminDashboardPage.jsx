import TopBar from "../components/TopBar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import {
  getAdminUsers, setUserActive,
  getAdminDoctors, setDoctorStatus,
  getAdminAnalytics,
} from "../services/api";
import { getAuditLogs, /* ...existing */ } from "../services/api";

const MICRO_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500";

const TABLE_WRAP = "overflow-x-auto rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)]";
const TABLE = "w-full min-w-[720px] text-left text-sm";
const THEAD_ROW = "border-b border-stone-200";
const TH = "px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500";
const TBODY_ROW = "border-b border-stone-100 transition last:border-0 hover:bg-stone-50/60";
const TD = "px-5 py-3.5 text-sm text-stone-700";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("analytics");
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);


const load = async () => {
  try {
    const [u, d, a, l] = await Promise.all([
      getAdminUsers(), getAdminDoctors(), getAdminAnalytics(), getAuditLogs(),
    ]);
    setUsers(u); setDoctors(d); setAnalytics(a); setAuditLogs(l);
  } catch (e) { setError(e?.message || "Failed to load admin data"); }
};



  useEffect(() => { load(); }, []);

  const toggleActive = async (u) => {
    try {
      await setUserActive(u.id, !u.is_active);
      load();
    } catch (e) {
      alert(e.response?.data?.detail || "Action failed");
    }
  };

  const changeDoctorStatus = async (id, status) => {
    try {
      await setDoctorStatus(id, status);
      load();
    } catch (e) {
      alert(e.response?.data?.detail || "Action failed");
    }
  };


  const TABS = ["analytics", "users", "doctors", "audit logs"];

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* ── header ── */}
        <header className="pb-2 pt-10">
          <p className={MICRO_LABEL}>
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            <span className="mx-2 text-stone-300">/</span> Admin console
          </p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-stone-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Operations
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Signed in as {user?.full_name} — platform oversight in one place.
          </p>
        </header>

        {/* ── tabs ── */}
        <nav className="mt-8 flex gap-7 border-b border-stone-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize transition ${
                tab === t
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {error && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {/* ── Analytics ── */}
        {tab === "analytics" && analytics && (
          <section className="mt-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Total users", analytics.total_users],
                ["Doctors", analytics.total_doctors],
                ["Patients", analytics.total_patients],
                ["Pending appointments", analytics.appointments_by_status?.pending ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)]"
                >
                  <p className={MICRO_LABEL}>{label}</p>
                  <p className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-stone-900">
                    {value ?? "—"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
              <p className={MICRO_LABEL}>Appointments by status</p>
              <div className="mt-2 divide-y divide-stone-100">
                {Object.entries(analytics.appointments_by_status || {}).map(([s, c]) => (
                  <div key={s} className="flex items-center justify-between py-2.5">
                    <span className="text-sm capitalize text-stone-600">
                      {s.replaceAll("_", " ").toLowerCase()}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-stone-900">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <section className={`mt-5 ${TABLE_WRAP}`}>
            <table className={TABLE}>
              <thead>
                <tr className={THEAD_ROW}>
                  <th className={TH}>Name</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Visits</th>
                  <th className={TH}>Status</th>
                  <th className={TH}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={TBODY_ROW}>
                    <td className={TD}>
                      <p className="font-medium text-stone-900">{u.full_name}</p>
                      <p className="text-[13px] text-stone-500">{u.email}</p>
                    </td>
                    <td className={`${TD} capitalize`}>{u.role}</td>
                    <td className={`${TD} tabular-nums`}>{u.appointment_count}</td>
                    <td className={TD}>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                          u.is_active
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-stone-200/70 text-stone-500"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-emerald-700" : "bg-stone-400"}`} />
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={`${TD} text-right`}>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition ${
                          u.is_active
                            ? "text-red-700 hover:bg-red-50"
                            : "bg-teal-800 text-white hover:bg-teal-900"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Doctors ── */}
        {tab === "doctors" && (
          <section className={`mt-5 ${TABLE_WRAP}`}>
            <table className={TABLE}>
              <thead>
                <tr className={THEAD_ROW}>
                  <th className={TH}>Name</th>
                  <th className={TH}>Specialty</th>
                  <th className={TH}>Fee</th>
                  <th className={TH}>Status</th>
                  <th className={TH}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id} className={TBODY_ROW}>
                    <td className={TD}>
                      <p className="font-medium text-stone-900">{d.full_name}</p>
                      <p className="text-[13px] text-stone-500">{d.email}</p>
                    </td>
                    <td className={TD}>{d.specialty}</td>
                    <td className={`${TD} tabular-nums`}>{d.fee != null ? `₹${d.fee}` : "—"}</td>
                    <td className={TD}><StatusBadge status={d.status} /></td>
                    <td className={`${TD} text-right`}>
                      <span className="inline-flex gap-2">
                        {d.status !== "approved" && (
                          <button
                            onClick={() => changeDoctorStatus(d.id, "approved")}
                            className="rounded-lg bg-teal-800 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-teal-900"
                          >
                            Approve
                          </button>
                        )}
                        {d.status !== "blocked" && (
                          <button
                            onClick={() => changeDoctorStatus(d.id, "blocked")}
                            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-red-700 transition hover:bg-red-50"
                          >
                            Block
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-400">No doctors found</td></tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Audit log ── */}
        {tab === "audit logs" && (
          <section className={`mt-5 ${TABLE_WRAP}`}>
            <table className={TABLE}>
              <thead>
                <tr className={THEAD_ROW}>
                  <th className={TH}>When</th>
                  <th className={TH}>Admin</th>
                  <th className={TH}>Action</th>
                  <th className={TH}>Target</th>
                  <th className={TH}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((lg) => (
                  <tr key={lg.id} className={TBODY_ROW}>
                    <td className={`${TD} whitespace-nowrap font-mono text-[12px] text-stone-500`}>
                      {new Date(lg.created_at).toLocaleString()}
                    </td>
                    <td className={TD}>{lg.admin_email}</td>
                    <td className={TD}>
                      <span className="inline-flex rounded-full bg-stone-900 px-2.5 py-1 font-mono text-[11px] font-medium text-white">
                        {lg.action}
                      </span>
                    </td>
                    <td className={`${TD} whitespace-nowrap font-mono text-[12px] text-stone-500`}>
                      {lg.target_type} #{lg.target_id ?? "—"}
                    </td>
                    <td className={`${TD} max-w-[280px] truncate text-[13px] text-stone-500`}>
                      {lg.detail ? (typeof lg.detail === "string" ? JSON.parse(lg.detail).email ?? lg.detail : lg.detail?.email ?? "") : "—"}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-400">No audit activity yet</td></tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}

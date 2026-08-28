import { useCallback, useEffect, useState } from "react";
import ChangePasswordPanel from "../components/ChangePasswordPanel.jsx";
import TopBar from "../components/TopBar.jsx";
import AppointmentCard from "../components/AppointmentCard.jsx";
import AvailabilityPanel from "../components/AvailabilityPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchTodayAppointments,
  fetchTodayStats,
  fetchDoctorPatients,
  fetchPatientHistory,
} from "../services/doctorPanelService";

const STATUS_TABS = [null, "PENDING", "CONFIRMED", "WAITING", "IN_CONSULTATION"];

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const status = user.doctor_profile?.status;

  // today's appointments state
  const [today, setToday] = useState([]);
  const [stats, setStats] = useState(null);
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
      const [list, s] = await Promise.all([fetchTodayAppointments(), fetchTodayStats()]);
      setToday(list);
      setStats(s);
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
      <>
        <TopBar />
        <main className="page">
          <h1>Welcome, Dr. {user.full_name}</h1>
          <p className="notice">
            Your account is pending admin approval. You'll appear in patient search once approved.
          </p>
          <ChangePasswordPanel />
        </main>
      </>
    );
  }

  if (status === "blocked") {
    return (
      <>
        <TopBar />
        <main className="page">
          <h1>Welcome, Dr. {user.full_name}</h1>
          <p className="notice notice-error">Your account has been blocked.</p>
        </main>
      </>
    );
  }

  const visible = filter ? today.filter((a) => a.status === filter) : today;

  return (
    <>
      <TopBar />
      <main className="page">
        <h1>Welcome, Dr. {user.full_name}</h1>

        {/* ---- main tabs ---- */}
        <div className="filter-tabs">
          <button
            className={tab === "today" ? "tab active" : "tab"}
            onClick={() => { setTab("today"); setHistoryFor(null); }}
          >
            Today's Appointments
          </button>
          <button
            className={tab === "patients" ? "tab active" : "tab"}
            onClick={openPatients}
          >
            My Patients
          </button>
          <button
            className={tab === "availability" ? "tab active" : "tab"}
            onClick={() => { setTab("availability"); setHistoryFor(null); }}
          >
            Availability
          </button>
        </div>

        {error && <p className="notice notice-error">{error}</p>}
        {loading && <p className="page-loading">Loading...</p>}

        {!loading && !error && (
          <>
            {/* ================= TODAY TAB ================= */}
            {tab === "today" && (
              <>
                {stats && (
                  <div className="stats-row">
                    <span>Total: <b>{stats.TOTAL}</b></span>
                    <span>Pending: <b>{stats.PENDING}</b></span>
                    <span>Confirmed: <b>{stats.CONFIRMED}</b></span>
                    <span>Waiting: <b>{stats.WAITING}</b></span>
                    <span>In consultation: <b>{stats.IN_CONSULTATION}</b></span>
                  </div>
                )}

                <div className="filter-tabs">
                  {STATUS_TABS.map((s) => (
                    <button
                      key={s ?? "all"}
                      className={filter === s ? "tab active" : "tab"}
                      onClick={() => setFilter(s)}
                    >
                      {s ? String(s).replaceAll("_", " ") : "All"}
                    </button>
                  ))}
                  <button onClick={refresh} className="btn btn-small">↻ Refresh</button>
                </div>

                {visible.length === 0 ? (
                  <p>No appointments{filter ? ` with status ${filter}` : " today"}.</p>
                ) : (
                  visible.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      onUpdated={() => refresh()} // re-fetch so stats stay in sync
                      onError={(m) => setError(m)}
                    />
                  ))
                )}
              </>
            )}

            {/* ================= PATIENTS TAB ================= */}
            {tab === "patients" && !historyFor && (
              <>
                <h2>My Patients</h2>
                {patients.length === 0 ? (
                  <p>No patients yet. Patients appear here after they book with you.</p>
                ) : (
                  patients.map((p) => (
                    <div key={p.id} className="appointment-card">
                      <div>
                        <b>{p.full_name}</b> · Age: {p.age ?? "?"} · Blood group:{" "}
                        {p.blood_group ?? "?"} · {p.email}
                      </div>
                      <button className="btn btn-small" onClick={() => openHistory(p.id)}>
                        View history
                      </button>
                    </div>
                  ))
                )}
              </>
            )}

            {tab === "patients" && historyFor && (
              <>
                <h2>Patient History</h2>
                <button className="btn btn-small" onClick={() => setHistoryFor(null)}>
                  ← Back to patients
                </button>

                {history.length === 0 ? (
                  <p>No appointments found for this patient.</p>
                ) : (
                  history.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      onUpdated={() => openHistory(historyFor)} // keep history fresh after actions
                      onError={(m) => setError(m)}
                    />
                  ))
                )}
              </>
            )}

            {/* ================= AVAILABILITY TAB ================= */}
            {tab === "availability" && (
              <AvailabilityPanel onError={(m) => setError(m)} />
            )}
          </>
        )}
        <ChangePasswordPanel />
      </main>
    </>
  );
}

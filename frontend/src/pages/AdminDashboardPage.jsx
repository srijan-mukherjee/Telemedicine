import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import {
  getAdminUsers, setUserActive,
  getAdminDoctors, setDoctorStatus,
  getAdminAnalytics,
} from "../services/api";
import { getAuditLogs, /* ...existing */ } from "../services/api";

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

  

  return (
    <>
      <TopBar />
      <main className="page">
        <h1>Welcome, {user?.full_name}</h1>
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["analytics", "users", "doctors" , "audit logs"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded capitalize ${tab === t ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
              {t}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* Analytics */}
        {tab === "analytics" && analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card label="Total Users" value={analytics.total_users} />
            <Card label="Doctors" value={analytics.total_doctors} />
            <Card label="Patients" value={analytics.total_patients} />
            <Card label="Pending Appts" value={analytics.appointments_by_status?.pending ?? 0} />
            <div className="col-span-full bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Appointments by Status</h3>
              {Object.entries(analytics.appointments_by_status || {}).map(([s, c]) => (
                <div key={s} className="flex justify-between py-1 border-b last:border-0">
                  <span>{s}</span><span className="font-semibold">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-3">Name</th><th>Email</th><th>Role</th>
                <th>Appts</th><th>Active</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3">{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.appointment_count}</td>
                  <td>{u.is_active ? "✅" : "⛔"}</td>
                  <td className="p-3">
                    <button onClick={() => toggleActive(u)}
                      className={`px-3 py-1 rounded text-white ${u.is_active ? "bg-red-500" : "bg-green-600"}`}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Doctors */}
        {tab === "doctors" && (
          <table className="w-full bg-white rounded shadow text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-3">Name</th><th>Specialty</th><th>Fee</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-3">{d.full_name}<div className="text-xs text-gray-500">{d.email}</div></td>
                  <td>{d.specialty}</td>
                  <td>{d.fee != null ? `₹${d.fee}` : "—"}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td className="p-3 flex gap-2">
                    {d.status !== "approved" && (
                      <button onClick={() => changeDoctorStatus(d.id, "approved")}
                        className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                    )}
                    {d.status !== "blocked" && (
                      <button onClick={() => changeDoctorStatus(d.id, "blocked")}
                        className="px-3 py-1 rounded bg-red-500 text-white">Block</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "audit logs" && (
  <table className="w-full bg-white rounded shadow text-sm">
    <thead>
      <tr className="text-left border-b bg-gray-50">
        <th className="p-3">When</th><th>Admin</th><th>Action</th>
        <th>Target</th><th>Detail</th>
      </tr>
    </thead>
    <tbody>
      {auditLogs.map((lg) => (
        <tr key={lg.id} className="border-b">
          <td className="p-3 text-xs text-gray-600">
            {new Date(lg.created_at).toLocaleString()}
          </td>
          <td>{lg.admin_email}</td>
          <td>
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {lg.action}
            </span>
          </td>
          <td className="text-xs">{lg.target_type} #{lg.target_id ?? "—"}</td>
          <td className="text-xs text-gray-500">
            {lg.detail ? (typeof lg.detail === "string" ? JSON.parse(lg.detail).email ?? lg.detail : lg.detail?.email ?? "") : "—"}
          </td>
        </tr>
      ))}
      {auditLogs.length === 0 && (
        <tr><td colSpan={5} className="p-4 text-center text-gray-400">No audit activity yet</td></tr>
      )}
    </tbody>
  </table>
)}

      </main>
    </>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { approved: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800", blocked: "bg-red-100 text-red-700" };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100"}`}>{status}</span>;
}

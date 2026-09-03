import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import ChangePasswordPanel from "../components/ChangePasswordPanel.jsx";
import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchMyPrescriptions, downloadPrescriptionPdf } from "../services/doctorPanelService";

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

  return (
    <>
      <TopBar />
      <main className="page">
        <h1>Welcome, {user?.full_name || "Patient"}</h1>

        {/* Action cards & quick links */}
        <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexWrap: 'wrap' }}>
          <div
            className="dashboard-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate("/symptom-checker")}
          >
            <h3>🩺 AI Symptom Checker</h3>
            <p>Describe your symptoms and get instant triage guidance</p>
          </div>

          <Link to="/doctors">
            <button>Find a Doctor</button>
          </Link>
          <Link to="/my-appointments">
            <button>My Appointments</button>
          </Link>
        </div>

        <h2>My Prescriptions</h2>
        {rxError && <p className="notice notice-error">{rxError}</p>}
        {rxList.length === 0 ? (
          <p>No prescriptions yet.</p>
        ) : (
          rxList.map((rx) => (
            <div key={rx.id} className="appointment-card">
              <div>
                <b>{new Date(rx.created_at).toLocaleDateString()}</b>
                {" — "}{rx.diagnosis || "No diagnosis recorded"}
                {" · "}{rx.items?.length || 0} medicine(s)
              </div>
              <button
                className="btn btn-small"
                onClick={() => downloadPrescriptionPdf(rx.appointment_id)}
              >
                PDF
              </button>
            </div>
          ))
        )}

        <ChangePasswordPanel />
      </main>
    </>
  );
}
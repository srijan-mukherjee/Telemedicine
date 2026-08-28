import { Link } from 'react-router-dom';
import ChangePasswordPanel from "../components/ChangePasswordPanel.jsx";
import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function PatientDashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <TopBar />
      <main className="page">
        <h1>Welcome, {user.full_name}</h1>
        <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
          <Link to="/doctors">
            <button>Find a Doctor</button>
          </Link>
          <Link to="/my-appointments">
            <button>My Appointments</button>
          </Link>
        </div>
        <ChangePasswordPanel />
      </main>
    </>
  );
}
import ChangePasswordPanel from "../components/ChangePasswordPanel.jsx";
import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Real admin dashboard content (doctor approval queue, analytics,
// audit logs) arrives in Phase 8.
export default function AdminDashboardPage() {
  const { user } = useAuth();
  return (
    <>
      <TopBar />
      <main className="page">
        <h1>Welcome, {user.full_name}</h1>
        <p>Admin dashboard — doctor approvals and analytics land in Phase 8.</p>
        <ChangePasswordPanel />
      </main>
    </>
  );
}

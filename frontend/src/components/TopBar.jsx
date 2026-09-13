import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="topbar">
      <span className="topbar-brand">Smart Telemedicine</span>
      {user && (
        <div className="topbar-user">
          <span className="role-badge">{user.role}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      )}
    </header>
  );
}

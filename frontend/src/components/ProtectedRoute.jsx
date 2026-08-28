import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

// Wraps a route element. Redirects to /login if unauthenticated,
// or to the user's own dashboard if their role isn't allowed here.
// This is a UX convenience only — the backend enforces RBAC for real
// (see require_roles in app/core/dependencies.py); the frontend
// check is never the source of truth.
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="page-loading">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return children;
}

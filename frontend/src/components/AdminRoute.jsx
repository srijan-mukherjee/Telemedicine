import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust to your auth context path

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;

  return children;
}

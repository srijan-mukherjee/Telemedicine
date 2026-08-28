import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import DoctorDashboardPage from "./pages/DoctorDashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PatientDashboardPage from "./pages/PatientDashboardPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DoctorProfile from './pages/DoctorProfile';
import MyAppointments from './pages/MyAppointments';
import DoctorsList from './pages/DoctorsList';



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/doctor/:id" element={<DoctorProfile />} />
      <Route path="/my-appointments" element={<MyAppointments />} />
      <Route path="/doctors" element={<DoctorsList />} />
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>

        }
      />
    </Routes>
  );
}

// Sends a logged-in user to their own dashboard, or an anonymous
// visitor to login — mirrors Flow 1's "Check Role in Token" redirect.
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p className="page-loading">Loading...</p>;
  return <Navigate to={user ? `/${user.role}` : "/login"} replace />;
}

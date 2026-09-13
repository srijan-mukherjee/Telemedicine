import { Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import DoctorDashboardPage from "./pages/DoctorDashboardPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PatientDashboardPage from "./pages/PatientDashboardPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DoctorProfile from './pages/DoctorProfile';
import MyAppointments from './pages/MyAppointments';
import DoctorsList from './pages/DoctorsList';
import SymptomChecker from "./pages/SymptomChecker";





export default function App() {
  return (
    <Routes>
      
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/doctor/:id"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <DoctorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-appointments"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <MyAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctors"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <DoctorsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/symptom-checker"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <SymptomChecker />
          </ProtectedRoute>
        }
      />
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


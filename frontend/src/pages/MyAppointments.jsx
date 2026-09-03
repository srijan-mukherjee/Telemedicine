import { useEffect, useState } from 'react';
import { getMyAppointments } from '../services/appointmentService';
import AppointmentCard from '../components/AppointmentCard'; // <-- Ensure this path is correct for your folder structure

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  // Updates the specific appointment in the list if the patient cancels it
  const handleAppointmentUpdated = (updatedAppt) => {
    setAppointments((prev) => 
      prev.map((a) => (a.id === updatedAppt.id ? updatedAppt : a))
    );
  };

  useEffect(() => {
    const fetchAppointments = () => {
      getMyAppointments()
        .then(setAppointments)
        .catch((err) => console.error("Failed to fetch appointments", err));
    };

    // 1. Fetch immediately on load
    fetchAppointments();

    // 2. Poll every 10 seconds so the video link appears instantly when the doctor starts it
    const intervalId = setInterval(fetchAppointments, 10000);

    // 3. Clean up the timer when leaving the page
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h2>My Appointments</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {appointments.length === 0 ? (
        <p>No appointments.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {appointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              role="patient"
              onUpdated={handleAppointmentUpdated}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
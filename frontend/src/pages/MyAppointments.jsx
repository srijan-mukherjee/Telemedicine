import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { getMyAppointments } from '../services/appointmentService';
import AppointmentCard from '../components/AppointmentCard'; // <-- Ensure this path is correct for your folder structure

const MICRO_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500";

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
    <div className="min-h-screen bg-[#f7f6f3]">
      <TopBar />
      <main className="mx-auto max-w-4xl px-6 pb-20">
        <header className="pb-2 pt-10">
          <p className={MICRO_LABEL}>Patient console</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4">
            <h1
              className="text-4xl font-semibold tracking-tight text-stone-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              My appointments
            </h1>
            {appointments.length > 0 && (
              <span className="text-sm tabular-nums text-stone-500">
                {appointments.length} total
              </span>
            )}
          </div>
        </header>

        {error && (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {appointments.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-stone-700">No appointments</p>
            <p className="mt-1 text-[13px] text-stone-500">
              Book a visit from the Find a Doctor page to get started.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
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
      </main>
    </div>
  );
}

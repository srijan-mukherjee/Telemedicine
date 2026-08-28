import { useEffect, useState } from 'react';
import { getMyAppointments } from '../services/appointmentService';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    getMyAppointments().then(setAppointments).catch(() => {});
  }, []);

  return (
    <div>
      <h2>My Appointments</h2>
      {appointments.length === 0 ? <p>No appointments.</p> : (
        <ul>
          {appointments.map(a => (
            <li key={a.id}>
              {a.appointment_datetime} – {a.status} (Ref: {a.reference_number})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
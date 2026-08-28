import { useState } from 'react';
import { bookAppointment } from '../services/appointmentService';

export default function BookingForm({ doctorId, slot, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    // Safety net: the user may have sat on this page until the slot passed.
    if (new Date(slot) <= new Date()) {
      alert('That time has already passed. Please pick another slot.');
      return;
    }
    setLoading(true);
    try {
      const result = await bookAppointment(doctorId, slot, reason);
      alert(`Booking confirmed! Ref: ${result.reference_number}`);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        placeholder="Reason for visit (optional)"
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows="2"
        style={{ width: '100%', maxWidth: '400px' }}
      />
      <br />
      <button onClick={handleBook} disabled={loading}>
        {loading ? 'Booking...' : 'Book Appointment'}
      </button>
    </div>
  );
}

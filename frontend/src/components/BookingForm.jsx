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
    <div className="flex flex-col gap-3">
      <p className="text-sm tabular-nums text-stone-600">
        Selected slot —{" "}
        <span className="font-semibold text-stone-900">
          {new Date(slot).toLocaleString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </p>
      <textarea
        placeholder="Reason for visit (optional)"
        value={reason}
        onChange={e => setReason(e.target.value)}
        rows="2"
        className="w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
      />
      <button
        onClick={handleBook}
        disabled={loading}
        className="inline-flex w-fit items-center rounded-lg bg-teal-800 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-teal-900 active:scale-[0.99] disabled:opacity-60"
      >
        {loading ? 'Booking...' : 'Book appointment'}
      </button>
    </div>
  );
}

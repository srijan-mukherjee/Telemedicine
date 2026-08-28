import { useEffect, useState } from 'react';
import { getAvailableSlots } from '../services/appointmentService';

// Parse "09:00", "09:00:00", etc. into a real Date for the given day
function slotToDate(dateStr, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(h, m || 0, 0, 0);
  return d;
}

// "09:00:00" or "09:00" -> "9:00 AM"
function formatTime(hhmmss) {
  const [h, m] = hhmmss.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const mins = String(m).padStart(2, '0');
  return hour + ':' + mins + ' ' + suffix;
}

export default function SlotPicker({ doctorId, date, onSelect }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    getAvailableSlots(doctorId, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  if (loading) return <div>Loading slots...</div>;
  if (!slots.length) return <div>No slots available on this date.</div>;

  // Hide slots that already started today
  const now = new Date();
  const bookable = slots.filter((slot) => slotToDate(date, slot.start_time) > now);

  if (!bookable.length) return <div>No more available slots for this day.</div>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {bookable.map((slot, idx) => (
        <button key={idx} onClick={() => onSelect(slot.slot_datetime)}>
          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
        </button>
      ))}
    </div>
  );
}

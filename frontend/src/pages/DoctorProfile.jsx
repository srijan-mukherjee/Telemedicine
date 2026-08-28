import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '../services/api';
import SlotPicker from '../components/SlotPicker';
import BookingForm from '../components/BookingForm';

export default function DoctorProfile() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    apiGet(`/doctors/${id}`)
      .then(setDoctor)
      .catch(() => setDoctor(null));
  }, [id]);

  if (!doctor) return <div>Loading doctor...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2>{doctor.full_name}</h2>
      <p><strong>Specialty:</strong> {doctor.specialty_name}</p>
      <p><strong>Experience:</strong> {doctor.years_experience} years</p>
      <p><strong>Fee:</strong> ₹{doctor.consultation_fee}</p>
      <p>{doctor.bio}</p>
      <hr />
      <h3>Book an Appointment</h3>
      <input
        type="date"
        min={new Date().toISOString().split("T")[0]}
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      {selectedDate && (
        <SlotPicker
          doctorId={id}
          date={selectedDate}
          onSelect={setSelectedSlot}
        />
      )}
      {selectedSlot && (
        <BookingForm
          doctorId={doctor.user_id}
          slot={selectedSlot}
          onSuccess={() => {
            setSelectedSlot(null);
            setSelectedDate('');
          }}
        />
      )}
    </div>
  );
}   
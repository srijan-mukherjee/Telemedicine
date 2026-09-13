import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import { apiGet } from '../services/api';
import SlotPicker from '../components/SlotPicker';
import BookingForm from '../components/BookingForm';

const MICRO_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500";

function initials(name) {
  const parts = String(name || "").replace(/^dr\.?\s+/i, "").trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "–";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

  if (!doctor) {
    return (
      <div className="min-h-screen bg-[#f7f6f3]">
        <TopBar />
        <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
          <div className="h-64 animate-pulse rounded-2xl bg-stone-200/60" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <TopBar />
      <main className="mx-auto max-w-4xl px-6 pb-20">
        {/* ── profile header ── */}
        <header className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.05)] sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-800/10 text-lg font-semibold tracking-wide text-teal-900">
              {initials(doctor.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className={MICRO_LABEL}>{doctor.specialty_name}</p>
              <h1
                className="mt-1 text-3xl font-semibold tracking-tight text-stone-900"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {doctor.full_name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[13px] tabular-nums text-stone-600">
                  {doctor.years_experience} yrs experience
                </span>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[13px] tabular-nums text-stone-600">
                  ₹{doctor.consultation_fee} / visit
                </span>
              </div>
            </div>
          </div>
          {doctor.bio && (
            <p className="mt-5 max-w-2xl border-t border-stone-100 pt-5 text-[15px] leading-relaxed text-stone-600">
              {doctor.bio}
            </p>
          )}
        </header>

        {/* ── booking ── */}
        <section className="mt-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.05)] sm:p-8">
          <p className={MICRO_LABEL}>Book an appointment</p>
          <div className="mt-4 max-w-xs">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
              Visit date
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
              />
            </label>
          </div>
          {selectedDate && (
            <div className="mt-5 border-t border-stone-100 pt-5">
              <p className="mb-3 text-[13px] font-medium text-stone-700">Available times</p>
              <SlotPicker
                doctorId={id}
                date={selectedDate}
                onSelect={setSelectedSlot}
              />
            </div>
          )}
          {selectedSlot && (
            <div className="mt-5 rounded-xl border border-teal-800/20 bg-teal-800/[0.04] p-4">
              <BookingForm
                doctorId={doctor.user_id}
                slot={selectedSlot}
                onSuccess={() => {
                  setSelectedSlot(null);
                  setSelectedDate('');
                }}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

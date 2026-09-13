import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import { apiGet } from '../services/api';

const MICRO_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500";

function initials(name) {
  const parts = String(name || "").replace(/^dr\.?\s+/i, "").trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "–";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async (query = '') => {
    setLoading(true);
    try {
      const res = await apiGet(`/doctors${query ? `?search=${encodeURIComponent(query)}` : ''}`);
      setDoctors(res || []);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load: show all doctors
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle search button click
  const handleSearch = () => {
    fetchDoctors(search);
  };

  // Handle Enter key press in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <header className="max-w-2xl pb-2 pt-10">
          <p className={MICRO_LABEL}>Patient console</p>
          <h1
            className="mt-2 text-4xl font-semibold tracking-tight text-stone-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Find a doctor
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Verified practitioners, real-time availability, transparent fees.
          </p>
        </header>

        {/* search */}
        <div className="mt-6 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or specialty…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl border border-stone-300/80 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="shrink-0 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* results */}
        {loading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-stone-200/60" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-stone-700">No doctors found</p>
            <p className="mt-1 text-[13px] text-stone-500">
              Try a different name or specialty.
            </p>
          </div>
        ) : (
          <>
            <p className={`${MICRO_LABEL} mt-8`}>
              Available doctors
              <span className="ml-2 tabular-nums text-stone-400">{doctors.length}</span>
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map(doc => (
                <Link
                  key={doc.id}
                  to={`/doctor/${doc.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition hover:shadow-[0_4px_16px_rgba(28,25,23,0.07)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-800/10 text-[13px] font-semibold tracking-wide text-teal-900">
                      {initials(doc.full_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-stone-900">
                        {doc.full_name}
                      </p>
                      <p className="truncate text-[13px] text-stone-500">{doc.specialty_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-[13px] tabular-nums text-stone-500">
                    <span>{doc.years_experience} yrs exp</span>
                    <span className="font-semibold text-stone-900">₹{doc.consultation_fee}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[13px] font-medium text-teal-800 transition group-hover:gap-2">
                    View profile
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

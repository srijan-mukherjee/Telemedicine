import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../services/api';

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
    <div>
      <h2>Find a Doctor</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search by name, specialty..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ padding: '0.5rem', width: '100%', maxWidth: '400px' }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading ? (
        <p>Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <p>No doctors found.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {doctors.map(doc => (
            <div key={doc.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', width: '250px' }}>
              <h3>{doc.full_name}</h3>
              <p><strong>Specialty:</strong> {doc.specialty_name}</p>
              <p><strong>Experience:</strong> {doc.years_experience} years</p>
              <p><strong>Fee:</strong> ₹{doc.consultation_fee}</p>
              <Link to={`/doctor/${doc.id}`}>View Profile</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
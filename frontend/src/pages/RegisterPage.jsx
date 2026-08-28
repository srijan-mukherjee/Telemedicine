import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerDoctorRequest, registerPatientRequest, fetchSpecialties } from "../services/authService.js";

const emptyPatientForm = {
  email: "",
  password: "",
  full_name: "",
  phone: "",
  blood_group: "",
};

const emptyDoctorForm = {
  email: "",
  password: "",
  full_name: "",
  phone: "",
  specialty_id: "",
  qualification: "",
  years_experience: "",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role === "doctor" && specialties.length === 0) {
      fetchSpecialties()
        .then(setSpecialties)
        .catch(() => setSpecialties([]));
    }
  }, [role, specialties.length]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (role === "patient") {
        await registerPatientRequest(patientForm);
      } else {
        await registerDoctorRequest({
          ...doctorForm,
          specialty_id: Number(doctorForm.specialty_id),
          years_experience: doctorForm.years_experience ? Number(doctorForm.years_experience) : null,
        });
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1>Registration successful</h1>
          {role === "doctor" ? (
            <p>Your account was created and is pending admin approval before it appears in doctor search.</p>
          ) : (
            <p>Your account was created.</p>
          )}
          <button onClick={() => navigate("/login")}>Go to login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>

        <div className="role-toggle">
          <button type="button" className={role === "patient" ? "active" : ""} onClick={() => setRole("patient")}>
            I'm a Patient
          </button>
          <button type="button" className={role === "doctor" ? "active" : ""} onClick={() => setRole("doctor")}>
            I'm a Doctor
          </button>
        </div>

        {role === "patient" ? (
          <PatientFields form={patientForm} setForm={setPatientForm} />
        ) : (
          <DoctorFields form={doctorForm} setForm={setDoctorForm} specialties={specialties} />
        )}

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}

function PatientFields({ form, setForm }) {
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  return (
    <>
      <label htmlFor="full_name">Full name</label>
      <input id="full_name" value={form.full_name} onChange={update("full_name")} required />

      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={form.email} onChange={update("email")} required />

      <label htmlFor="phone">Phone</label>
      <input id="phone" value={form.phone} onChange={update("phone")} />

      <label htmlFor="blood_group">Blood group</label>
      <input id="blood_group" value={form.blood_group} onChange={update("blood_group")} placeholder="e.g. O+" />

      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={form.password} onChange={update("password")} required minLength={8} />
    </>
  );
}

function DoctorFields({ form, setForm, specialties }) {
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  return (
    <>
      <label htmlFor="d_full_name">Full name</label>
      <input id="d_full_name" value={form.full_name} onChange={update("full_name")} required />

      <label htmlFor="d_email">Email</label>
      <input id="d_email" type="email" value={form.email} onChange={update("email")} required />

      <label htmlFor="d_phone">Phone</label>
      <input id="d_phone" value={form.phone} onChange={update("phone")} />

      <label htmlFor="specialty_id">Specialty</label>
      <select id="specialty_id" value={form.specialty_id} onChange={update("specialty_id")} required>
        <option value="" disabled>
          Select a specialty
        </option>
        {specialties.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <label htmlFor="qualification">Qualification</label>
      <input id="qualification" value={form.qualification} onChange={update("qualification")} placeholder="e.g. MBBS, MD" />

      <label htmlFor="years_experience">Years of experience</label>
      <input
        id="years_experience"
        type="number"
        min="0"
        value={form.years_experience}
        onChange={update("years_experience")}
      />

      <label htmlFor="d_password">Password</label>
      <input id="d_password" type="password" value={form.password} onChange={update("password")} required minLength={8} />
    </>
  );
}

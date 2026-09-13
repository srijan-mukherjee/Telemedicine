import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerDoctorRequest, registerPatientRequest, fetchSpecialties } from "../services/authService.js";
import AuthShowcase from "../components/AuthShowcase.jsx";
import "../styles/login.css";

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

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-foreground text-[15px] placeholder:text-muted-foreground/60 outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/20";

const labelClass = "text-sm text-muted-foreground";

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

  return (
    <main className="login-cinema min-h-screen lg:h-screen flex flex-col lg:flex-row lg:overflow-hidden bg-background text-foreground">
      {/* ── LEFT — shared app showcase (same on login + register) ── */}
      <AuthShowcase />

      {/* ── RIGHT — full-bleed register panel (the only column that scrolls) ── */}
      <section className="relative flex-1 flex lg:h-screen lg:overflow-y-auto bg-accent lg:border-l border-white/10">
        <div className="animate-fade-rise-delay-2 w-full m-auto flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12">
          {success ? (
            <div className="flex flex-col items-start gap-4">
              <span className="w-14 h-14 rounded-full bg-emerald-400/15 border border-emerald-300/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <h2
                className="text-foreground text-4xl font-normal tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Registration successful
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {role === "doctor"
                  ? "Your account was created and is pending admin approval before it appears in doctor search."
                  : "Your account was created. You can now sign in."}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 bg-foreground text-[#04121f] font-semibold rounded-xl px-8 py-3.5 text-[15px] transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
              >
                Go to login
              </button>
            </div>
          ) : (
            <>
              <h2
                className="text-foreground text-4xl font-normal tracking-tight mb-3"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Create an account
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                Join Smart Telemedicine as a patient or a doctor.
              </p>

              <div className="flex gap-2.5 mb-8">
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer ${
                    role === "patient"
                      ? "bg-foreground text-[#04121f]"
                      : "border border-white/15 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  I&apos;m a Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer ${
                    role === "doctor"
                      ? "bg-foreground text-[#04121f]"
                      : "border border-white/15 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  I&apos;m a Doctor
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {role === "patient" ? (
                  <PatientFields form={patientForm} setForm={setPatientForm} />
                ) : (
                  <DoctorFields form={doctorForm} setForm={setDoctorForm} specialties={specialties} />
                )}

                {error && (
                  <p className="border border-red-400/30 bg-red-500/10 text-red-200 rounded-xl px-4 py-3 text-sm leading-relaxed">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 w-full bg-foreground text-[#04121f] font-semibold rounded-xl py-3.5 text-[15px] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {submitting && (
                    <span className="w-4 h-4 rounded-full border-2 border-[#04121f]/30 border-t-[#04121f] animate-spin" />
                  )}
                  {submitting ? "Creating account..." : "Register"}
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-8">
                Already have an account?{" "}
                <Link to="/login" className="text-foreground font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function PatientFields({ form, setForm }) {
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="full_name" className={labelClass}>Full name</label>
        <input id="full_name" value={form.full_name} onChange={update("full_name")} required placeholder="Your full name" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" type="email" value={form.email} onChange={update("email")} required autoComplete="email" placeholder="you@example.com" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className={labelClass}>Phone</label>
        <input id="phone" value={form.phone} onChange={update("phone")} placeholder="+91 ..." className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="blood_group" className={labelClass}>Blood group</label>
        <input id="blood_group" value={form.blood_group} onChange={update("blood_group")} placeholder="e.g. O+" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" type="password" value={form.password} onChange={update("password")} required minLength={8} autoComplete="new-password" placeholder="Minimum 8 characters" className={inputClass} />
      </div>
    </>
  );
}

function DoctorFields({ form, setForm, specialties }) {
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="d_full_name" className={labelClass}>Full name</label>
        <input id="d_full_name" value={form.full_name} onChange={update("full_name")} required placeholder="Dr. Your Name" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="d_email" className={labelClass}>Email</label>
        <input id="d_email" type="email" value={form.email} onChange={update("email")} required autoComplete="email" placeholder="you@example.com" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="d_phone" className={labelClass}>Phone</label>
        <input id="d_phone" value={form.phone} onChange={update("phone")} placeholder="+91 ..." className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="specialty_id" className={labelClass}>Specialty</label>
        <select
          id="specialty_id"
          value={form.specialty_id}
          onChange={update("specialty_id")}
          required
          className={`${inputClass} [&>option]:text-slate-900`}
        >
          <option value="" disabled>
            Select a specialty
          </option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="qualification" className={labelClass}>Qualification</label>
        <input id="qualification" value={form.qualification} onChange={update("qualification")} placeholder="e.g. MBBS, MD" className={inputClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="years_experience" className={labelClass}>Years of experience</label>
        <input
          id="years_experience"
          type="number"
          min="0"
          value={form.years_experience}
          onChange={update("years_experience")}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="d_password" className={labelClass}>Password</label>
        <input id="d_password" type="password" value={form.password} onChange={update("password")} required minLength={8} autoComplete="new-password" placeholder="Minimum 8 characters" className={inputClass} />
      </div>
    </>
  );
}

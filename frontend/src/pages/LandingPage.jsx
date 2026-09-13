import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/landing.css";

// ─── Scroll-reveal hook ──────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Photo section component — half-blur effect ──────────────────────────────
function PhotoSection({ image, tag, title, body, reverse }) {
  const { ref, visible } = useReveal(0.08);

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-700 hover:shadow-2xl ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ minHeight: 500 }}
    >
      {/* Layer 1 — sharp base image */}
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
      />

      {/* Layer 2 — soft overall dim so the glass panel reads over bright photos */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(135deg, rgba(10,28,50,0.42) 0%, rgba(10,28,50,0.22) 55%, rgba(10,28,50,0.08) 100%)",
        }}
      />

      {/* Frosted glass text panel */}
      <div
        className={`relative z-10 flex items-center h-full min-h-[500px] p-6 md:p-12 ${
          reverse ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`max-w-lg rounded-2xl border border-white/25 bg-slate-900/30 shadow-2xl backdrop-blur-xl p-8 md:p-10 transition-all duration-700 delay-200 ${
            visible
              ? "opacity-100 translate-x-0"
              : reverse
              ? "opacity-0 translate-x-10"
              : "opacity-0 -translate-x-10"
          }`}
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-sky-300 mb-4 border border-sky-300/30 px-3 py-1 rounded-full">
            {tag}
          </span>
          <h3
            className="text-white mb-5 leading-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "2rem",
              fontWeight: 600,
            }}
          >
            {title}
          </h3>
          <p
            className="text-slate-300 leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Animated count-up hook (stats) ──────────────────────────────────────────
function useCountUp(target, started, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, started, duration]);
  return value;
}

// ─── Stat card (counts up when scrolled into view) ───────────────────────────
function StatCard({ target, decimals = 0, suffix = "", label }) {
  const { ref, visible } = useReveal(0.4);
  const value = useCountUp(target, visible);
  const display =
    value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 hover:scale-105 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="text-center">
        <div
          className="text-4xl font-bold text-slate-800 mb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {display}
        </div>
        <div
          className="text-sm text-slate-500 tracking-wide uppercase font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial card ────────────────────────────────────────────────────────
function TestimonialCard({ quote, name, role, img, delay }) {
  const { ref, visible } = useReveal(0.1);
  return (
    <div
      ref={ref}
      className={`bg-white rounded-2xl p-8 border border-slate-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: visible ? "0ms" : delay }}
    >
      <div className="flex gap-1 mb-5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="w-4 h-4 text-amber-400 fill-amber-400"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p
        className="text-slate-600 text-sm leading-relaxed mb-6 italic"
        style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
      >
        "{quote}"
      </p>
      <div className="flex items-center gap-3">
        <img
          src={img}
          alt={name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div
            className="text-slate-800 text-sm font-semibold"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {name}
          </div>
          <div
            className="text-slate-400 text-xs"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {role}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Landing page ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroReveal = useReveal(0.01);
  const featuresHead = useReveal(0.2);
  const stepsHead = useReveal(0.2);
  const stepsGrid = useReveal(0.1);
  const testiHead = useReveal(0.2);
  const footerReveal = useReveal(0.3);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToLogin = () => {
    setMenuOpen(false);
    navigate("/login");
  };

  const photos = {
    // Hero — Indian doctor with patient, stethoscope check (Imad Clicks)
    hero: "https://images.pexels.com/photos/14558557/pexels-photo-14558557.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1600",
    // Patient Records — Indian doctor taking BP (Imad Clicks)
    feature1:
      "https://images.pexels.com/photos/14558560/pexels-photo-14558560.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    // Appointment Scheduling — Ahmedabad fertility clinic India (Mayflower Fertility)
    feature2:
      "https://images.pexels.com/photos/36035002/pexels-photo-36035002.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    // Clinical Documentation — doctor writing notes clipboard
    feature3:
      "https://images.pexels.com/photos/6129043/pexels-photo-6129043.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    // Team Collaboration — diverse hospital team
    feature4:
      "https://images.pexels.com/photos/6129502/pexels-photo-6129502.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    // Testimonial avatars — Indian/South Asian context
    t1: "https://images.pexels.com/photos/36665076/pexels-photo-36665076.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    t2: "https://images.pexels.com/photos/14558557/pexels-photo-14558557.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
    t3: "https://images.pexels.com/photos/36035002/pexels-photo-36035002.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=100&w=100",
  };

  return (
    <div
      className="landing-root min-h-screen bg-slate-50"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Navbar ── */}
      <nav
        className={`landing-nav-in fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
            : "bg-transparent"
        }`}
      >
        {/* readability gradient while the navbar is transparent over the hero */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-black/50 to-transparent pointer-events-none transition-opacity duration-300 ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          className="relative z-10 max-w-7xl mx-auto px-6 flex items-center justify-between"
          style={{ height: 72 }}
        >
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer transition-transform duration-300 hover:scale-[1.04]"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#0ea5e9" }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span
              className={`font-semibold text-lg tracking-tight transition-colors ${
                scrolled ? "text-slate-800" : "text-white"
              }`}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Smart Telemedicine
            </span>
          </div>

          {/* Desktop nav — intentionally empty; links removed */}
          <div className="hidden md:flex items-center gap-8" />

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={goToLogin}
              className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-white text-slate-900 border border-white shadow-md hover:bg-sky-50 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98] transition-all duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/40 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
            >
              Register
            </button>
          </div>

          {/* Mobile burger */}
          <button
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-slate-700" : "text-white bg-black/25 backdrop-blur-sm"
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="landing-menu-in md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full text-sm py-2.5 border border-slate-200 rounded-lg text-slate-700 font-medium transition-transform active:scale-[0.98]"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/register");
                }}
                className="w-full text-sm py-2.5 bg-sky-500 text-white rounded-lg font-semibold transition-transform active:scale-[0.98]"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <img
          src={photos.hero}
          alt="Healthcare professionals in a modern clinic"
          className="landing-kenburns absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,20,40,0.92) 0%, rgba(8,20,40,0.70) 60%, rgba(8,20,40,0.40) 100%)",
          }}
        />

        <div
          ref={heroReveal.ref}
          className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20"
        >
          {/* Headline */}
          <h1
            className={`text-white leading-tight mb-6 max-w-3xl transition-all duration-700 ${
              heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              fontWeight: 600,
              lineHeight: 1.15,
              transitionDelay: "80ms",
            }}
          >
            Healthcare Management,{" "}
            <span className="text-sky-300">Redefined</span> for Modern Clinics
          </h1>

          {/* Subheadline */}
          <p
            className={`text-white/70 max-w-xl mb-10 leading-relaxed transition-all duration-700 ${
              heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ fontSize: "1.1rem", fontWeight: 300, transitionDelay: "200ms" }}
          >
            Smart Telemedicine unifies patient records, appointment scheduling, and
            physician workflows into one elegant, secure platform — so care teams
            can focus entirely on what matters.
          </p>

          {/* CTA row */}
          <div
            className={`flex flex-wrap gap-4 transition-all duration-700 ${
              heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "320ms" }}
          >
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg text-sm tracking-wide"
            >
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-white/10 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm border border-white/20 text-white font-medium rounded-xl transition-all duration-200 text-sm tracking-wide flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Watch Overview
            </button>
          </div>

          {/* Social proof avatars */}
          <div
            className={`mt-14 flex items-center gap-4 transition-all duration-700 ${
              heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "440ms" }}
          >
            <div className="flex -space-x-2">
              {[photos.t1, photos.t2, photos.t3].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Healthcare professional"
                  className="w-9 h-9 rounded-full border-2 border-white/40 object-cover"
                />
              ))}
            </div>
            <div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p
                className="text-white/60 text-xs mt-0.5"
                style={{ fontWeight: 300 }}
              >
                Rated 4.9/5 by healthcare professionals
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-white/20 animate-pulse" />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-slate-100">
          <StatCard target={2400} decimals={0} suffix="+" label="Clinics Worldwide" />
          <StatCard target={1.2} decimals={1} suffix="M+" label="Patients Managed" />
          <StatCard target={98.9} decimals={1} suffix="%" label="System Uptime" />
          <StatCard target={4} decimals={0} suffix=" min" label="Avg. Setup Time" />
        </div>
      </section>

      {/* ── Features (half-blur photo sections) ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 space-y-6">
        {/* Section header */}
        <div
          ref={featuresHead.ref}
          className={`text-center mb-16 transition-all duration-700 ${
            featuresHead.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-sky-600 border border-sky-200 px-3 py-1 rounded-full">
            Platform Features
          </span>
          <h2
            className="text-slate-800 mt-5 mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              fontWeight: 600,
            }}
          >
            Everything a Clinic Needs, Nothing It Doesn't
          </h2>
        </div>

        <PhotoSection
          image={photos.feature1}
          tag="Patient Records"
          title="Complete Patient Histories, Always at Hand"
          body="Access full clinical histories, lab results, prescriptions, and visit notes in a single unified timeline. Role-based permissions ensure the right information reaches the right person — securely and instantly."
          reverse={false}
        />
        <PhotoSection
          image={photos.feature2}
          tag="Appointment Scheduling"
          title="Zero-Friction Booking for Patients & Staff"
          body="Intelligent scheduling automatically suggests optimal slots, sends automated reminders, and eliminates double-bookings. Patients can self-schedule online, reducing front-desk workload by up to 60%."
          reverse={true}
        />
        <PhotoSection
          image={photos.feature3}
          tag="Clinical Documentation"
          title="Structured Notes That Save Hours Every Week"
          body="Customisable templates, voice-to-text dictation, and smart auto-fill dramatically reduce documentation time. Doctors spend less time on paperwork and more time with patients."
          reverse={false}
        />
        <PhotoSection
          image={photos.feature4}
          tag="Team Collaboration"
          title="Care Teams That Work in Sync"
          body="Real-time task assignment, internal messaging, and shared care plans keep every member of the clinical team aligned — whether they're in the same room or across different facilities."
          reverse={true}
        />
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-slate-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={stepsHead.ref}
            className={`text-center mb-16 transition-all duration-700 ${
              stepsHead.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-sky-400 border border-sky-400/30 px-3 py-1 rounded-full">
              How It Works
            </span>
            <h2
              className="text-white mt-5 mb-4"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 600,
              }}
            >
              Up and Running in Minutes
            </h2>
            <p
              className="text-center text-slate-400 max-w-xl mx-auto"
              style={{ fontWeight: 300, lineHeight: 1.7 }}
            >
              Our onboarding is designed so clinics can migrate from legacy
              systems without disruption.
            </p>
          </div>

          <div ref={stepsGrid.ref} className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Register your clinic in under four minutes. Add your practice details, specialties, and number of practitioners.",
                icon: "🏥",
              },
              {
                step: "02",
                title: "Import Patient Data",
                desc: "Migrate existing patient records via CSV, HL7, or FHIR. Our team assists with complex migrations at no extra cost.",
                icon: "📋",
              },
              {
                step: "03",
                title: "Go Live",
                desc: "Invite your staff, configure permissions, and start managing appointments and records — all on day one.",
                icon: "✅",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative bg-slate-700/50 border border-slate-600/50 rounded-2xl p-8 transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:border-sky-400/40 ${
                  stepsGrid.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: stepsGrid.visible ? "0ms" : `${i * 130}ms` }}
              >
                <div
                  className="text-6xl font-bold text-slate-600 absolute top-6 right-8 select-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.step}
                </div>
                <div className="text-3xl mb-5">{item.icon}</div>
                <h4
                  className="text-white text-lg font-semibold mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.title}
                </h4>
                <p
                  className="text-slate-400 text-sm leading-relaxed"
                  style={{ fontWeight: 300 }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="testimonials"
        className="bg-slate-50 border-y border-slate-100 py-24"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={testiHead.ref}
            className={`text-center mb-14 transition-all duration-700 ${
              testiHead.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-sky-600 border border-sky-200 px-3 py-1 rounded-full">
              Testimonials
            </span>
            <h2
              className="text-slate-800 mt-5"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                fontWeight: 600,
              }}
            >
              Trusted by Clinicians Who Care
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              delay="0ms"
              img={photos.t1}
              name="Dr. Sarah Mitchell"
              role="Family Physician, Boston Medical Group"
              quote="Smart Telemedicine eliminated the paperwork bottleneck that was consuming two hours of my day. My patient notes are sharper and I leave on time now."
            />
            <TestimonialCard
              delay="100ms"
              img={photos.t2}
              name="Dr. James Okafor"
              role="Internal Medicine, Sunrise Health Network"
              quote="We rolled out across three clinics in a single weekend. The migration support team was exceptional and the interface is refreshingly intuitive."
            />
            <TestimonialCard
              delay="200ms"
              img={photos.t3}
              name="Amanda Torres"
              role="Practice Manager, Westside Specialists"
              quote="Appointment no-shows dropped 38% within the first month. The automated reminders and online booking have transformed our front desk operations entirely."
            />
          </div>
        </div>
      </section>

      {/* ── Simple footer ── */}
      <footer
        ref={footerReveal.ref}
        className={`bg-slate-900 py-10 transition-opacity duration-1000 ${
          footerReveal.visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm font-bold text-white">
            This project is made by :-
          </p>
          <ol className="flex flex-col items-center gap-1.5">
            {[
              "SAYON BISWAS",
              "SRIJAN MUKHERJEE",
              "SOUMIK ROY",
              "SHRISTI KUMARI",
              "SAYANI DIBAR",
            ].map((name) => (
              <li key={name} className="text-sm font-bold text-white">
                {name}
              </li>
            ))}
          </ol>
        </div>
      </footer>
    </div>
  );
}

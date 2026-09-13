import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import AuthShowcase from "../components/AuthShowcase.jsx";
import "../styles/login.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-cinema min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
      {/* ── LEFT — shared app showcase (same on login + register) ── */}
      <AuthShowcase />

      {/* ── RIGHT — full-bleed premium login panel ── */}
      <section className="relative flex-1 flex items-stretch justify-center bg-accent lg:border-l border-white/10">
        <div className="animate-fade-rise-delay-2 w-full flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12">
          <h2
            className="text-foreground text-4xl font-normal tracking-tight mb-3"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Welcome back
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Sign in to continue to your care dashboard.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-foreground text-[15px] placeholder:text-muted-foreground/60 outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 pr-20 text-foreground text-[15px] placeholder:text-muted-foreground/60 outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

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
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-4 mt-8 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground">New here?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={() => navigate("/register")}
            className="liquid-glass w-full rounded-xl py-3 text-sm font-medium text-foreground hover:scale-[1.01] active:scale-[0.99] transition-transform cursor-pointer"
          >
            Create an account
          </button>

          <p className="text-center text-xs text-muted-foreground/70 mt-8">
            Protected by encrypted authentication.
          </p>
        </div>
      </section>
    </main>
  );
}

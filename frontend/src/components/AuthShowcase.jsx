import { Link } from "react-router-dom";

// Shared left panel for the login and register pages: blue backdrop with
// three floating phone mockups (video visit, specialist finder, doctor
// profile). Kept in one place so both auth pages always look identical.
export default function AuthShowcase() {
  return (
      <section className="relative overflow-hidden flex flex-col flex-1 min-h-[92vh] lg:min-h-screen bg-[#2563eb]">
        {/* soft glow behind the phones */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)",
          }}
        />

        {/* slim brand row */}
        <header className="relative z-10 flex items-center justify-between px-6 py-6 animate-fade-rise">
          <Link
            to="/"
            className="text-white text-2xl tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Smart Telemedicine
          </Link>
        </header>

        {/* phones stage */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-8 pb-12 pt-2">
          {/* Phone A — video visit */}
          <div className="animate-fade-rise hidden sm:block w-44 md:w-52 shrink-0 -rotate-[8deg] translate-y-8">
            <div className="animate-phone-float rounded-[2.4rem] border-[10px] border-slate-950 bg-slate-900 shadow-2xl overflow-hidden">
              <div className="relative h-[420px] md:h-[460px] flex flex-col">
                <img
                  src="https://images.pexels.com/photos/14558557/pexels-photo-14558557.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=620"
                  alt="Doctor on video call"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-2/3"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0) 100%)",
                  }}
                />
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-950 rounded-full" />
                <div className="relative flex items-center justify-between px-5 pt-3 text-[9px] font-semibold text-white">
                  <span>9:41</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11h3l2-5 3 10 2.5-6H18v9H2v-8z" opacity="0.9" />
                    </svg>
                    <svg className="w-4 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 16">
                      <rect x="1" y="3" width="17" height="10" rx="2" />
                      <path d="M20 6l3-2v8l-3-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <div className="absolute top-12 right-3 w-14 h-[4.5rem] rounded-xl overflow-hidden border-2 border-white/50 shadow-lg">
                  <img
                    src="https://images.pexels.com/photos/14558560/pexels-photo-14558560.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=160"
                    alt="Patient"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative mt-auto pb-5 px-4 text-center">
                  <p className="text-white text-sm font-semibold">Dr. Arjun Nair</p>
                  <p className="text-white/70 text-[10px] tracking-widest mb-3">20:34</p>
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    </span>
                    <span className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white rotate-[135deg]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </span>
                    <span className="w-9 h-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <span className="w-9 h-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phone B — find your specialist (front) */}
          <div className="animate-fade-rise-delay w-52 md:w-64 shrink-0 z-10 -ml-4 -mr-4 sm:-ml-8 sm:-mr-8">
            <div className="animate-phone-float-delay rounded-[2.4rem] border-[10px] border-slate-950 bg-slate-50 shadow-2xl overflow-hidden">
              <div className="relative h-[460px] md:h-[500px] flex flex-col text-slate-900">
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-950 rounded-full z-10" />
                <div className="flex items-center justify-between px-5 pt-3 text-[9px] font-semibold text-slate-900">
                  <span>9:41</span>
                  <span className="w-12" />
                </div>
                <p className="px-4 pt-2 text-[9px] text-slate-500">Find Your</p>
                <div className="px-4 flex items-center justify-between">
                  <h4 className="text-lg font-bold tracking-tight">Specialist</h4>
                  <span className="flex items-center gap-2 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
                    </svg>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </span>
                </div>
                <div className="mx-4 mt-2 rounded-2xl p-3 text-white flex items-center gap-3" style={{ background: "linear-gradient(120deg, #1d4ed8 0%, #3b82f6 100%)" }}>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold leading-snug">Looking For Your Desire Specialist Doctor?</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <img src="https://images.pexels.com/photos/14558560/pexels-photo-14558560.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=96&h=96" alt="Dr. Asha Rao" className="w-6 h-6 rounded-full object-cover border border-white/50" />
                      <div>
                        <p className="text-[8px] font-semibold leading-none">Dr. Asha Rao</p>
                        <p className="text-[7px] text-white/70">General Physician</p>
                      </div>
                    </div>
                  </div>
                  <img src="https://images.pexels.com/photos/14558560/pexels-photo-14558560.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=160&h=180" alt="" aria-hidden="true" className="w-12 h-14 rounded-xl object-cover" />
                </div>
                <div className="px-4 mt-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold">Categories</p>
                  <p className="text-[8px] text-slate-400">See All</p>
                </div>
                <div className="px-4 mt-1.5 grid grid-cols-4 gap-1.5">
                  {[
                    ["Pe", "Pediatrician", "from-rose-400 to-orange-300"],
                    ["Ne", "Neurosurgeon", "from-violet-400 to-purple-300"],
                    ["Ca", "Cardiologist", "from-red-400 to-rose-300"],
                    ["Ps", "Psychiatrist", "from-amber-400 to-yellow-300"],
                  ].map(([mono, name, grad]) => (
                    <div key={name} className="flex flex-col items-center gap-1">
                      <span className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${grad} text-white text-[10px] font-bold flex items-center justify-center shadow-sm`}>
                        {mono}
                      </span>
                      <span className="text-[6.5px] text-slate-500 text-center leading-tight">{name}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 mt-2.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold">Available Doctor</p>
                  <p className="text-[8px] text-slate-400">See All</p>
                </div>
                <div className="px-4 mt-1.5 grid grid-cols-2 gap-1.5">
                  {[
                    ["https://images.pexels.com/photos/36665076/pexels-photo-36665076.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=300&h=170", "Dr. Vikram Mehta", "15 Years", "3.2K"],
                    ["https://images.pexels.com/photos/36035002/pexels-photo-36035002.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=300&h=170", "Dr. Rohit Verma", "8 Years", "1.9K"],
                  ].map(([img, name, exp, patients]) => (
                    <div key={name} className="bg-white rounded-xl p-1.5 shadow-sm border border-slate-100">
                      <img src={img} alt={name} className="w-full h-12 rounded-lg object-cover" />
                      <p className="text-[8px] font-semibold mt-1 leading-none">{name}</p>
                      <p className="text-amber-400 text-[7px] leading-none mt-0.5">★★★★★</p>
                      <p className="text-[7px] text-slate-400 mt-0.5">Exp: {exp}</p>
                      <p className="text-[7px] text-slate-400">Patients: {patients}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto mx-4 mb-3 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-around py-2">
                  <span className="flex items-center gap-1 bg-blue-600 text-white text-[8px] font-semibold rounded-full px-3 py-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
                    </svg>
                    Home
                  </span>
                  {[
                    "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
                    "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
                    "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
                  ].map((d, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Phone C — doctor profile */}
          <div className="animate-fade-rise-delay-2 hidden sm:block w-44 md:w-52 shrink-0 rotate-[8deg] translate-y-8">
            <div className="animate-phone-float-delay-2 rounded-[2.4rem] border-[10px] border-slate-950 bg-white shadow-2xl overflow-hidden">
              <div className="relative h-[420px] md:h-[460px] flex flex-col text-slate-900 overflow-y-hidden">
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-950 rounded-full z-10" />
                <div className="flex items-center justify-between px-4 pt-3 text-[9px] font-semibold">
                  <span>9:41</span>
                  <span className="w-12" />
                </div>
                <div className="px-4 pt-1 flex items-center gap-2">
                  <span className="text-slate-400 text-sm leading-none">‹</span>
                  <p className="text-[11px] font-semibold">Dr. Neha Kapoor</p>
                </div>
                <img src="https://images.pexels.com/photos/36665076/pexels-photo-36665076.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=540" alt="Dr. Neha Kapoor" className="mx-4 mt-2 h-32 md:h-36 rounded-2xl object-cover object-top" />
                <div className="px-4 mt-2 flex gap-1.5">
                  <span className="text-[7.5px] font-semibold text-blue-700 bg-blue-100 rounded-full px-2.5 py-1">Voice Call</span>
                  <span className="text-[7.5px] font-semibold text-violet-700 bg-violet-100 rounded-full px-2.5 py-1">Video Call</span>
                  <span className="text-[7.5px] font-semibold text-orange-700 bg-orange-100 rounded-full px-2.5 py-1">Message</span>
                </div>
                <p className="px-4 mt-2 text-[11px] font-bold leading-tight">Dermatology</p>
                <p className="px-4 text-[8px] text-slate-400">Skin Health Studio, MBBS, DDVL</p>
                <p className="px-4 text-amber-400 text-[8px] mt-0.5">★★★★★</p>
                <p className="px-4 mt-1.5 text-[9px] font-semibold">About Neha</p>
                <p className="px-4 text-[7.5px] text-slate-400 leading-snug">
                  Caring dermatologist focused on skin health, prevention, and long-term patient wellness.
                </p>
                <div className="px-4 mt-2 flex justify-between text-center">
                  {[
                    ["2.1K", "Patients"],
                    ["9 Years", "Experience"],
                    ["4.8K", "Reviews"],
                  ].map(([v, l]) => (
                    <div key={l}>
                      <p className="text-[10px] font-bold">{v}</p>
                      <p className="text-[7px] text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 mt-auto mb-3">
                  <div className="rounded-xl py-2.5 text-center text-white text-[10px] font-semibold" style={{ background: "linear-gradient(120deg, #1d4ed8 0%, #3b82f6 100%)" }}>
                    Book an Appointment
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* floating glass badge */}
        <div className="animate-phone-float-delay-2 absolute z-20 top-24 right-6 xl:right-14 hidden md:inline-flex liquid-glass rounded-full px-4 py-2 text-[11px] font-medium text-white items-center gap-1.5">
          <span className="text-amber-300">★</span> 4.9 · Loved by patients
        </div>
      </section>
  );
}

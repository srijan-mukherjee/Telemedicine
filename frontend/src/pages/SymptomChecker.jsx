import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar.jsx";
import { sendChatMessage, listConversations, getConversation } from "../services/api";

import "./SymptomChecker.css";

const MICRO_LABEL = "text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500";

const URGENCY_STYLES = {
  emergency: {
    label: "Emergency — call emergency services now",
    dot: "bg-red-700",
    panel: "border-red-200 bg-red-50 text-red-900",
  },
  urgent: {
    label: "Urgent — seek care today",
    dot: "bg-amber-600",
    panel: "border-amber-200 bg-amber-50 text-amber-900",
  },
  soon: {
    label: "See a doctor soon",
    dot: "bg-sky-700",
    panel: "border-sky-200 bg-sky-50 text-sky-900",
  },
  routine: {
    label: "Routine — home care may help",
    dot: "bg-emerald-700",
    panel: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
};

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);       // {role, text, urgency?, meta?}
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [lastTriage, setLastTriage] = useState(null); // urgency + doctors of latest reply
  const [doctorsOpen, setDoctorsOpen] = useState(true);
  const bottomRef = useRef(null);

  const refreshConversations = () =>
    listConversations()
      .then(setConversations)
      .catch(() => {}); // sidebar failure shouldn't break chat

  useEffect(() => {
    refreshConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setMessages((m) => [...m, { role: "patient", text }]);
    setSending(true);
    try {
      const res = await sendChatMessage(text, conversationId);
      if (res.conversation_id) setConversationId(res.conversation_id);
      setLastTriage({
        urgency: res.urgency,
        specialty: res.recommended_specialty,
        redFlags: res.red_flags || [],
        doctors: res.suggested_doctors || [],
      });
      setDoctorsOpen(true);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: res.answer,
          urgency: res.urgency,
          specialty: res.recommended_specialty,
        },
      ]);
      refreshConversations();
    } catch (err) {
      const raw = err?.message || "";
      const detail =
        raw === "Failed to fetch"
          ? "Couldn't reach the server — it may have stopped. Please try again in a moment."
          : raw || "AI service is temporarily unavailable. Please try again shortly.";
      setMessages((m) => [...m, { role: "assistant", text: detail }]);
    } {
      setSending(false);
    }
  };

  const openConversation = async (id) => {
        const data = await getConversation(id);
    setConversationId(id);
    setLastTriage(null);

    const msgs = (data.messages || data || []).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "patient",  // "user" → patient side
      text: m.content,
      urgency: m.meta?.urgency,
      specialty: m.meta?.recommended_specialty,
    }));
    setMessages(msgs);

    // restore urgency banner + specialty from the last AI message
    const lastAi = [...msgs].reverse().find((m) => m.role === "assistant");
    if (lastAi) {
      setLastTriage({
        urgency: lastAi.urgency,
        specialty: lastAi.specialty,
        redFlags: [],
        doctors: [], // historical view — cards only show for fresh replies
      });
    }

  };

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setLastTriage(null);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const banner = lastTriage ? URGENCY_STYLES[lastTriage.urgency] : null;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f7f6f3]">
      <TopBar />
      <main className="flex min-h-0 w-full flex-1 flex-col px-4 pt-6 pb-4 lg:px-6">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
          {/* ── Sidebar: history ── */}
          <aside className="flex flex-col gap-2 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
            <button
              onClick={newChat}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-stone-800 active:scale-[0.99]"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New chat
            </button>
            <p className={`${MICRO_LABEL} px-1 pt-2`}>Conversations</p>
            <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => openConversation(c.id)}
                    className={`w-full truncate rounded-lg px-3 py-2 text-left text-[13px] transition ${
                      c.id === conversationId
                        ? "bg-stone-900 font-medium text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <span className={`mr-2 font-mono text-[11px] tabular-nums ${c.id === conversationId ? "text-white/60" : "text-stone-400"}`}>
                      #{c.id}
                    </span>
                    {c.last_message || c.first_message || `Conversation ${c.id}`}
                  </button>
                </li>
              ))}
              {conversations.length === 0 && (
                <li className="px-3 py-2 text-[13px] text-stone-400">No conversations yet</li>
              )}
            </ul>
          </aside>

          {/* ── Main chat ── */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)]">
            {banner && (
              <div className={`flex shrink-0 items-center gap-2.5 border-b px-5 py-3 text-sm ${banner.panel}`}>
                <span className={`h-2 w-2 shrink-0 rounded-full ${banner.dot}`} />
                <p>
                  <span className="font-semibold">{banner.label}</span>
                  {lastTriage?.urgency === "emergency" && (
                    <span> — Please call emergency services or go to the nearest ER now. Do NOT wait for an online reply.</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[#f7f6f3]/60 px-5 py-5">
              {messages.length === 0 && (
                <div className="mx-auto my-auto max-w-md rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-8 text-center">
                  <p className="text-sm font-medium text-stone-700">How can I help today?</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
                    Tell me what&apos;s bothering you — e.g.{" "}
                    <em>&ldquo;I have an itchy rash on my arm since two days.&rdquo;</em>
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "patient" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "patient"
                        ? "rounded-br-md bg-teal-800 text-white"
                        : "rounded-bl-md border border-stone-200/80 bg-white text-stone-800 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
                    }`}
                  >
                    {m.text}
                    {m.role === "assistant" && m.specialty && (
                      <p className="mt-2 border-t border-stone-100 pt-2 text-[12px] font-medium text-teal-900">
                        Suggested specialty — {m.specialty}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="sc-typing flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-stone-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Suggested doctors (never in emergency) ── */}
            {lastTriage && lastTriage.urgency !== "emergency" && lastTriage.doctors?.length > 0 && (
              <div className="shrink-0 border-t border-stone-200/70 bg-white px-5 py-3">
                <button
                  onClick={() => setDoctorsOpen((o) => !o)}
                  className="group flex w-full items-center justify-between"
                  aria-expanded={doctorsOpen}
                >
                  <p className={MICRO_LABEL}>
                    Recommended {lastTriage.specialty} doctors
                  </p>
                  <svg
                    className={`h-4 w-4 text-stone-500 transition-transform duration-200 group-hover:text-stone-800 ${doctorsOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    doctorsOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {lastTriage.doctors.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-[#f7f6f3]/60 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-stone-900">{d.full_name}</p>
                          <p className="truncate text-[12px] text-stone-500">{d.specialty}</p>
                          <p className="mt-0.5 text-[12px] tabular-nums text-stone-500">
                            <span className="text-amber-500">★</span> {d.rating ?? "New"} · ₹{d.consultation_fee ?? "—"}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/doctor/${d.doctor_profile_id}`)}
                          className="shrink-0 rounded-lg bg-teal-800 px-3 py-2 text-[12px] font-medium text-white transition hover:bg-teal-900 active:scale-[0.98]"
                        >
                          Book
                        </button>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex shrink-0 items-end gap-2 border-t border-stone-200/70 bg-white p-3">
              <textarea
                rows={2}
                value={input}
                placeholder="Describe your symptoms…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="max-h-32 min-h-[52px] flex-1 resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white transition hover:bg-stone-800 active:scale-[0.98] disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

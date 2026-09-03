import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendChatMessage, listConversations, getConversation } from "../services/api";

import "./SymptomChecker.css";

const URGENCY_STYLES = {
  emergency: { label: "🚨 EMERGENCY", cls: "banner-emergency" },
  urgent:    { label: "⚠️ Urgent — seek care today", cls: "banner-urgent" },
  soon:      { label: "🕒 See a doctor soon", cls: "banner-soon" },
  routine:   { label: "✅ Routine — home care may help", cls: "banner-routine" },
};

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);       // {role, text, urgency?, meta?}
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [lastTriage, setLastTriage] = useState(null); // urgency + doctors of latest reply
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
      const detail =
        err?.response?.data?.detail || "AI service unavailable. Please try again.";
      setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${detail}` }]);
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
    <div className="sc-page">
      {/* ── Sidebar: history ── */}
      <aside className="sc-sidebar">
        <button className="sc-new-btn" onClick={newChat}>＋ New Chat</button>
        <h3>My Conversations</h3>
        <ul>
          {conversations.map((c) => (
            <li
              key={c.id}
              className={c.id === conversationId ? "active" : ""}
              onClick={() => openConversation(c.id)}
            >
              <span className="sc-conv-id">#{c.id}</span>
              {c.last_message || c.first_message || `Conversation ${c.id}`}
            </li>
          ))}
          {conversations.length === 0 && <li className="empty">No conversations yet</li>}
        </ul>
      </aside>

      {/* ── Main chat ── */}
      <main className="sc-chat">
        <header className="sc-header">
          <h2>🩺 AI Symptom Checker</h2>
          <p>Describe your symptoms. Not a diagnosis — in emergencies call your local emergency number.</p>
        </header>

        {banner && (
          <div className={`sc-banner ${banner.cls}`}>
            <strong>{banner.label}</strong>
            {lastTriage?.urgency === "emergency" && (
              <span> — Please call emergency services or go to the nearest ER now. Do NOT wait for an online reply.</span>
            )}
 </div>
        )}

        <div className="sc-messages">
          {messages.length === 0 && (
            <div className="sc-welcome">
              👋 Hello! Tell me what's bothering you — e.g. <em>"I have an itchy rash on my arm since two days."</em>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`sc-msg ${m.role}`}>
              <div className="sc-bubble">
                {m.text}
                {m.role === "assistant" && m.specialty && (
                  <div className="sc-meta">Suggested specialty: {m.specialty}</div>
                )}
              </div>
            </div>
          ))}
          {sending && <div className="sc-msg assistant"><div className="sc-bubble typing">AI is thinking…</div></div>}
          <div ref={bottomRef} />
        </div>

        {/* ── Suggested doctors (never in emergency) ── */}
        {lastTriage && lastTriage.urgency !== "emergency" && lastTriage.doctors?.length > 0 && (
          <div className="sc-doctors">
            <h3>Recommended {lastTriage.specialty} doctors</h3>
            <div className="sc-doc-grid">
              {lastTriage.doctors.map((d) => (
                <div key={d.id} className="sc-doc-card">
                  <strong>{d.full_name}</strong>
                  <span>{d.specialty}</span>
                  <span>⭐ {d.rating ?? "New"} · ₹{d.consultation_fee ?? "—"}</span>
                  <button onClick={() => navigate(`/doctor/${d.doctor_profile_id}`)}>Book Appointment</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sc-input-row">
          <textarea
            rows={2}
            value={input}
            placeholder="Describe your symptoms…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button onClick={send} disabled={sending || !input.trim()}>Send ➤</button>
        </div>
      </main>
    </div>
  );
}

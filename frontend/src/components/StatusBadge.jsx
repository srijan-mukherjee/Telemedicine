// Soft status pill — muted paper tints, never neon. Same API as before.
const TONES = {
  PENDING: { text: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  CONFIRMED: { text: "#065f46", bg: "#d1fae5", border: "#a7f3d0" },
  WAITING: { text: "#0c4a6e", bg: "#e0f2fe", border: "#bae6fd" },
  IN_CONSULTATION: { text: "#5b21b6", bg: "#ede9fe", border: "#ddd6fe" },
  COMPLETED: { text: "#44403c", bg: "#f5f5f4", border: "#e7e5e4" },
  CANCELLED: { text: "#991b1b", bg: "#fee2e2", border: "#fecaca" },
  // admin account states (lowercase by convention)
  approved: { text: "#065f46", bg: "#d1fae5", border: "#a7f3d0" },
  pending: { text: "#92400e", bg: "#fef3c7", border: "#fde68a" },
  blocked: { text: "#991b1b", bg: "#fee2e2", border: "#fecaca" },
};

const FALLBACK = { text: "#44403c", bg: "#f5f5f4", border: "#e7e5e4" };

export default function StatusBadge({ status }) {
  const tone = TONES[status] || FALLBACK;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase"
      style={{
        color: tone.text,
        backgroundColor: tone.bg,
        border: `1px solid ${tone.border}`,
        letterSpacing: "0.08em",
      }}
    >
      {String(status).replaceAll("_", " ")}
    </span>
  );
}

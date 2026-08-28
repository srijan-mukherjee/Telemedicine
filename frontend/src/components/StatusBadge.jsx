const COLORS = {
  PENDING: "#b45309",
  CONFIRMED: "#15803d",
  WAITING: "#0369a1",
  IN_CONSULTATION: "#7c3aed",
  COMPLETED: "#475569",
  CANCELLED: "#b91c1c",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className="status-badge"
      style={{ color: COLORS[status] || "#333", border: `1px solid ${COLORS[status] || "#ccc"}` }}
    >
      {String(status).replaceAll("_", " ")}
    </span>
  );
}

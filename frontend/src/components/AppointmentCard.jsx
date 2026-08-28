import StatusBadge from "./StatusBadge";
import { updateAppointmentStatus } from "../services/doctorPanelService";

// Which action buttons to show per current status.
const NEXT_ACTIONS = {
  PENDING: [{ label: "Confirm", next: "CONFIRMED" }],
  CONFIRMED: [
    { label: "Mark Waiting", next: "WAITING" },
    { label: "Complete", next: "COMPLETED" },
  ],
  WAITING: [{ label: "Start Consultation", next: "IN_CONSULTATION" }],
  IN_CONSULTATION: [{ label: "Complete", next: "COMPLETED" }],
};
const CAN_CANCEL = ["PENDING", "CONFIRMED"];

export default function AppointmentCard({ appointment, onUpdated, onError }) {
  async function handleAction(next) {
    if (next === "CANCELLED" && !window.confirm("Cancel this appointment?")) return;
    try {
      const updated = await updateAppointmentStatus(appointment.id, next);
      onUpdated(updated);
    } catch (e) {
      onError?.(e.message);
    }
  }

  const when = new Date(appointment.appointment_datetime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="appt-card">
      <strong>{when}</strong>{" "}
      <StatusBadge status={appointment.status} />
      <p>
        <b>{appointment.patient_name}</b>
            {appointment.patient_age != null && <> · {appointment.patient_age} yrs</>}
            {appointment.patient_blood_group && <> · Blood group: {appointment.patient_blood_group}</>}
        </p>

      {appointment.reason_text && <p className="appt-reason">“{appointment.reason_text}”</p>}
      <p className="appt-ref">Ref: {appointment.reference_number}</p>

      {(NEXT_ACTIONS[appointment.status] || []).map((a) => (
        <button key={a.next} onClick={() => handleAction(a.next)} className="btn">
          {a.label}
        </button>
      ))}
      {CAN_CANCEL.includes(appointment.status) && (
        <button onClick={() => handleAction("CANCELLED")} className="btn btn-danger">
          Cancel
        </button>
      )}
    </div>
  );
}

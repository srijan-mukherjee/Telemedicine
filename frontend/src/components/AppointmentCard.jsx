import StatusBadge from "./StatusBadge";
import { updateAppointmentStatus } from "../services/doctorPanelService";
import PrescriptionForm from "./PrescriptionForm.jsx";
import PrescriptionView from "./PrescriptionView.jsx";

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
const CAN_PRESCRIBE = ["IN_CONSULTATION", "COMPLETED"];

export default function AppointmentCard({ appointment, role, onUpdated, onError }) {
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
        <b>{appointment.patient_name || "Patient"}</b>
        {appointment.patient_age != null && <> · {appointment.patient_age} yrs</>}
        {appointment.patient_blood_group && <> · Blood group: {appointment.patient_blood_group}</>}
      </p>

      {appointment.reason_text && <p className="appt-reason">“{appointment.reason_text}”</p>}
      <p className="appt-ref">Ref: {appointment.reference_number}</p>

      {/* --- NEW: JITSI VIDEO CALL BUTTON --- */}
      {appointment.status === 'IN_CONSULTATION' && appointment.meeting_link && (
        <div style={{ marginBottom: "10px", marginTop: "10px" }}>
          <a
            href={appointment.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{ backgroundColor: "#2563eb", color: "white", textDecoration: "none", display: "inline-block" }}
          >
            🎥 Join Video Call
          </a>
        </div>
      )}
      {/* ------------------------------------ */}

      {/* --- DOCTOR ONLY: Status transition buttons --- */}
      {role === "doctor" && (NEXT_ACTIONS[appointment.status] || []).map((a) => (
        <button key={a.next} onClick={() => handleAction(a.next)} className="btn">
          {a.label}
        </button>
      ))}

      {/* Both Doctor and Patient can cancel early appointments */}
      {CAN_CANCEL.includes(appointment.status) && (
        <button onClick={() => handleAction("CANCELLED")} className="btn btn-danger">
          Cancel
        </button>
      )}

      {/* doctor: write / edit prescription */}
      {role === "doctor" && CAN_PRESCRIBE.includes(appointment.status) && (
        <PrescriptionForm
          appointmentId={appointment.id}
          onError={onError}
          onSaved={onUpdated}
        />
      )}

      {/* patient: view + PDF download */}
      {role === "patient" && CAN_PRESCRIBE.includes(appointment.status) && (
        <PrescriptionView appointmentId={appointment.id} onError={onError} />
      )}
    </div>
  );
}
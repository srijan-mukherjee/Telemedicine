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

const PRIMARY_BTN =
  "inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-teal-900 active:scale-[0.99] cursor-pointer";
const QUIET_BTN =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-700 transition hover:bg-red-50 cursor-pointer";
const VIDEO_BTN =
  "inline-flex items-center gap-2 rounded-lg bg-sky-800 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-sky-900 active:scale-[0.99] cursor-pointer";

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
    <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition hover:shadow-[0_4px_16px_rgba(28,25,23,0.07)]">
      {/* header: time + status */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-stone-900">
          {when}
        </p>
        <StatusBadge status={appointment.status} />
      </div>

      {/* patient */}
      <p className="mt-1.5 text-sm text-stone-600">
        <span className="font-semibold text-stone-900">
          {appointment.patient_name || "Patient"}
        </span>
        {appointment.patient_age != null && <> · {appointment.patient_age} yrs</>}
        {appointment.patient_blood_group && <> · {appointment.patient_blood_group}</>}
      </p>

      {appointment.reason_text && (
        <p
          className="mt-3 border-l-2 border-stone-200 pl-3 text-[15px] italic leading-relaxed text-stone-600"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          “{appointment.reason_text}”
        </p>
      )}
      <p className="mt-2 font-mono text-[11px] tracking-wide text-stone-400">
        REF · {appointment.reference_number}
      </p>

      {/* actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
        {appointment.status === "IN_CONSULTATION" && appointment.meeting_link && (
          <a
            href={appointment.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className={VIDEO_BTN}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Join video call
          </a>
        )}

        {role === "doctor" &&
          (NEXT_ACTIONS[appointment.status] || []).map((a) => (
            <button key={a.next} onClick={() => handleAction(a.next)} className={PRIMARY_BTN}>
              {a.label}
            </button>
          ))}

        {CAN_CANCEL.includes(appointment.status) && (
          <button onClick={() => handleAction("CANCELLED")} className={QUIET_BTN}>
            Cancel
          </button>
        )}
      </div>

      {/* doctor: write / edit prescription */}
      {role === "doctor" && CAN_PRESCRIBE.includes(appointment.status) && (
        <div className="mt-4 rounded-xl border border-stone-200/70 bg-stone-50 p-4">
          <PrescriptionForm
            appointmentId={appointment.id}
            onError={onError}
            onSaved={onUpdated}
          />
        </div>
      )}

      {/* patient: view + PDF download */}
      {role === "patient" && CAN_PRESCRIBE.includes(appointment.status) && (
        <div className="mt-4 rounded-xl border border-stone-200/70 bg-stone-50 p-4">
          <PrescriptionView appointmentId={appointment.id} onError={onError} />
        </div>
      )}
    </article>
  );
}

import { useEffect, useState } from "react";
import { getPrescription, downloadPrescriptionPdf } from "../services/doctorPanelService";

export default function PrescriptionView({ appointmentId, onError }) {
  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPrescription(appointmentId)
      .then(setRx)
      .catch(() => setMissing(true)) // 404 = no prescription yet
      .finally(() => setLoading(false));
  }, [appointmentId]);

  if (loading || missing) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Prescription
        </h3>
        <button
          onClick={() => downloadPrescriptionPdf(appointmentId).catch((e) => onError?.(e.message))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-[13px] font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </button>
      </div>
      {rx.diagnosis && (
        <p className="text-sm text-stone-600">
          <span className="font-medium text-stone-500">Diagnosis — </span>
          <span className="text-stone-800">{rx.diagnosis}</span>
        </p>
      )}
      <ul className="divide-y divide-stone-200/70 rounded-xl border border-stone-200 bg-white">
        {rx.items.map((it) => (
          <li key={it.id} className="px-3.5 py-2.5 text-sm">
            <span className="font-medium text-stone-900">{it.medicine_name}</span>
            <span className="text-stone-500">
              {it.dosage && ` · ${it.dosage}`}
              {it.frequency && ` · ${it.frequency}`}
              {it.duration_days && ` · ${it.duration_days} days`}
            </span>
          </li>
        ))}
      </ul>
      {rx.advice && (
        <p className="text-sm text-stone-600">
          <span className="font-medium text-stone-500">Advice — </span>
          <span className="text-stone-800">{rx.advice}</span>
        </p>
      )}
      {rx.clinical_notes && (
        <p className="text-sm text-stone-600">
          <span className="font-medium text-stone-500">Notes — </span>
          <span className="text-stone-800">{rx.clinical_notes}</span>
        </p>
      )}
    </div>
  );
}

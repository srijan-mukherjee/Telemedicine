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
    <div className="prescription-view">
      <h3>
        Prescription{" "}
        <button className="btn btn-small" onClick={() => downloadPrescriptionPdf(appointmentId)}>
          ⬇ Download PDF
        </button>
      </h3>
      {rx.diagnosis && <p><b>Diagnosis:</b> {rx.diagnosis}</p>}
      <ul>
        {rx.items.map((it) => (
          <li key={it.id}>
            <b>{it.medicine_name}</b>
            {it.dosage && ` · ${it.dosage}`}
            {it.frequency && ` · ${it.frequency}`}
            {it.duration_days && ` · ${it.duration_days} days`}
          </li>
        ))}
      </ul>
      {rx.advice && <p><b>Advice:</b> {rx.advice}</p>}
      {rx.clinical_notes && <p><b>Notes:</b> {rx.clinical_notes}</p>}
    </div>
  );
}

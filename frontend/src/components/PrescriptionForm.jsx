import { useState } from "react";
import { getPrescription, createPrescription, updatePrescription } from "../services/doctorPanelService";

const EMPTY = { medicine_name: "", dosage: "", frequency: "", duration_days: "" };

export default function PrescriptionForm({ appointmentId, onError, onSaved }) {
  const [existing, setExisting] = useState(null); // loaded prescription (if any)
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ ...EMPTY }]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [formError, setFormError] = useState("");

  // Load existing prescription once (so doctor can edit instead of hitting 409)
  if (!loaded) {
    setLoaded(true);
    getPrescription(appointmentId)
      .then((rx) => {
        setExisting(rx);
        setDiagnosis(rx.diagnosis || "");
        setAdvice(rx.advice || "");
        setNotes(rx.clinical_notes || "");
        setItems(rx.items.map((it) => ({
          medicine_name: it.medicine_name,
          dosage: it.dosage || "",
          frequency: it.frequency || "",
          duration_days: it.duration_days || "",
        })));
      })
      .catch(() => {}); // 404 = none yet, fresh form stays
  }

  function setItem(i, field, value) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function addItem() { setItems([...items, { ...EMPTY }]); }
  function removeItem(i) { setItems(items.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const cleaned = items
        .filter((it) => it.medicine_name.trim())
        .map((it) => ({
          medicine_name: it.medicine_name,
          dosage: it.dosage || null,
          frequency: it.frequency || null,
          duration_days: it.duration_days ? Number(it.duration_days) : null,
        }));
      if (cleaned.length === 0) {
        setFormError("Add at least one medicine with a name");
        setSaving(false);
        return;
      }
      const payload = {
        diagnosis: diagnosis || null,
        advice: advice || null,
        clinical_notes: notes || null,
        items: cleaned,
      };
      if (existing) {
        await updatePrescription(appointmentId, payload);
      } else {
        await createPrescription(appointmentId, payload);
      }
      onSaved?.();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="prescription-form" onSubmit={submit}>
      <h3>{existing ? "Edit Prescription" : "New Prescription"}</h3>

      <label>
        Diagnosis:
        <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
      </label>

      <h4>Medicines</h4>
      {items.map((it, i) => (
        <div key={i} className="prescription-item-row">
          <input placeholder="Medicine name *" value={it.medicine_name}
                 onChange={(e) => setItem(i, "medicine_name", e.target.value)} required />
          <input placeholder="Dosage" value={it.dosage}
                 onChange={(e) => setItem(i, "dosage", e.target.value)} />
          <input placeholder="Frequency (e.g. 1-0-1)" value={it.frequency}
                 onChange={(e) => setItem(i, "frequency", e.target.value)} />
          <input placeholder="Days" type="number" min="1" value={it.duration_days}
                 onChange={(e) => setItem(i, "duration_days", e.target.value)} />
          <button type="button" className="btn btn-small" onClick={() => removeItem(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="btn btn-small" onClick={addItem}>+ Add medicine</button>

      <label>
        Advice:
        <textarea value={advice} onChange={(e) => setAdvice(e.target.value)} rows={2} />
      </label>
      <label>
        Clinical notes:
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </label>

      {formError && <p className="notice notice-error">{formError}</p>}

      <button type="submit" className="btn" disabled={saving}>
        {saving ? "Saving..." : existing ? "Update prescription" : "Save prescription"}
      </button>
    </form>
  );
}

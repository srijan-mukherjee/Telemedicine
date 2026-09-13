import { useState } from "react";
import { getPrescription, createPrescription, updatePrescription } from "../services/doctorPanelService";

const EMPTY = { medicine_name: "", dosage: "", frequency: "", duration_days: "" };

const FIELD =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15";

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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          {existing ? "Edit prescription" : "New prescription"}
        </h3>
      </div>

      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
        Diagnosis
        <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute viral pharyngitis" className={FIELD} />
      </label>

      <div className="flex flex-col gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Medicines
        </h4>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-[1fr_90px_110px_70px_auto]">
            <input placeholder="Medicine name *" value={it.medicine_name}
                   onChange={(e) => setItem(i, "medicine_name", e.target.value)} required className={FIELD} />
            <input placeholder="Dosage" value={it.dosage}
                   onChange={(e) => setItem(i, "dosage", e.target.value)} className={FIELD} />
            <input placeholder="Frequency (1-0-1)" value={it.frequency}
                   onChange={(e) => setItem(i, "frequency", e.target.value)} className={FIELD} />
            <input placeholder="Days" type="number" min="1" value={it.duration_days}
                   onChange={(e) => setItem(i, "duration_days", e.target.value)} className={FIELD} />
            <button
              type="button"
              onClick={() => removeItem(i)}
              aria-label="Remove medicine"
              className="flex h-9 w-9 items-center justify-center justify-self-end rounded-lg text-stone-400 transition hover:bg-red-50 hover:text-red-700 sm:justify-self-auto"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-3 py-2 text-[13px] font-medium text-stone-600 transition hover:border-teal-700 hover:text-teal-800"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add medicine
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
          Advice
          <textarea value={advice} onChange={(e) => setAdvice(e.target.value)} rows={2} className={`${FIELD} resize-none`} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
          Clinical notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${FIELD} resize-none`} />
        </label>
      </div>

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-fit items-center rounded-lg bg-stone-900 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? "Saving..." : existing ? "Update prescription" : "Save prescription"}
      </button>
    </form>
  );
}

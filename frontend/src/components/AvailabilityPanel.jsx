import { useEffect, useState } from "react";
import {
  fetchMyAvailability,
  addAvailability,
  deleteAvailability,
} from "../services/doctorPanelService";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FIELD =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15";

function ScheduleRow({ label, sub, onDelete, deleteLabel = "Delete" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-stone-900">{label}</p>
        {sub && <p className="text-[13px] tabular-nums text-stone-500">{sub}</p>}
      </div>
      <button
        onClick={onDelete}
        className="shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium text-stone-500 transition hover:bg-red-50 hover:text-red-700"
      >
        {deleteLabel}
      </button>
    </div>
  );
}

export default function AvailabilityPanel({ onError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [mode, setMode] = useState("recurring"); // recurring | specific | holiday
  const [day, setDay] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [specificDate, setSpecificDate] = useState("");
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    try {
      setItems(await fetchMyAvailability());
    } catch (e) {
      onError?.(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");

    let payload;
    if (mode === "recurring") {
      payload = { is_recurring: true, is_holiday: false, day_of_week: Number(day), start_time: startTime, end_time: endTime };
    } else if (mode === "specific") {
      if (!specificDate) return setFormError("Pick a date");
      payload = { is_recurring: false, is_holiday: false, specific_date: specificDate, start_time: startTime, end_time: endTime };
    } else {
      if (!specificDate) return setFormError("Pick a holiday date");
      payload = { is_recurring: false, is_holiday: true, specific_date: specificDate };
    }

    try {
      await addAvailability(payload);
      setSpecificDate("");
      await load();
    } catch (e) {
      // show backend validation message (e.g. "start_time must be before end_time")
      setFormError(typeof e.detail === "string" ? e.detail : e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAvailability(id);
      await load();
    } catch (e) {
      onError?.(e.message);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-200/60" />
        ))}
      </div>
    );
  }

  const recurring = items.filter((i) => i.is_recurring && !i.is_holiday);
  const oneOff = items.filter((i) => !i.is_recurring && !i.is_holiday);
  const holidays = items.filter((i) => i.is_holiday);

  const MODES = [
    ["recurring", "Weekly window"],
    ["specific", "One-off date"],
    ["holiday", "Holiday"],
  ];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
      {/* form card */}
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.05)]"
      >
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Add availability
          </h2>
          <p className="mt-1 text-[13px] text-stone-500">
            Patients can only book inside these windows.
          </p>
        </div>

        <div className="inline-flex gap-1 self-start rounded-lg bg-stone-200/70 p-1">
          {MODES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
                mode === value
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "recurring" && (
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
            Day of week
            <select value={day} onChange={(e) => setDay(e.target.value)} className={FIELD}>
              {DAYS.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
          </label>
        )}

        {mode !== "holiday" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
              Start
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
              End
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={FIELD} />
            </label>
          </div>
        )}

        {mode !== "recurring" && (
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-stone-700">
            Date
            <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} required className={FIELD} />
          </label>
        )}

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-stone-800 active:scale-[0.99]"
        >
          Add window
        </button>
        {formError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {formError}
          </p>
        )}
      </form>

      {/* schedule groups */}
      <div className="flex min-w-0 flex-col gap-6">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-12 text-center">
            <p className="text-sm font-medium text-stone-700">No availability yet</p>
            <p className="mt-1 text-[13px] text-stone-500">
              Add a weekly window to become bookable.
            </p>
          </div>
        )}

        {recurring.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Weekly schedule
            </h3>
            {recurring.map((i) => (
              <ScheduleRow
                key={i.id}
                label={DAYS[i.day_of_week] ?? `Day ${i.day_of_week}`}
                sub={`${i.start_time?.slice(0, 5)} – ${i.end_time?.slice(0, 5)}`}
                onDelete={() => handleDelete(i.id)}
              />
            ))}
          </section>
        )}

        {oneOff.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Extra dates
            </h3>
            {oneOff.map((i) => (
              <ScheduleRow
                key={i.id}
                label={i.specific_date}
                sub={`${i.start_time?.slice(0, 5)} – ${i.end_time?.slice(0, 5)}`}
                onDelete={() => handleDelete(i.id)}
              />
            ))}
          </section>
        )}

        {holidays.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Holidays
            </h3>
            {holidays.map((i) => (
              <ScheduleRow
                key={i.id}
                label={`Holiday · ${i.specific_date}`}
                onDelete={() => handleDelete(i.id)}
                deleteLabel="Remove"
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

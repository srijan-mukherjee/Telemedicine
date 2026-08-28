import { useEffect, useState } from "react";
import {
  fetchMyAvailability,
  addAvailability,
  deleteAvailability,
} from "../services/doctorPanelService";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

  if (loading) return <p className="page-loading">Loading availability...</p>;

  const recurring = items.filter((i) => i.is_recurring && !i.is_holiday);
  const oneOff = items.filter((i) => !i.is_recurring && !i.is_holiday);
  const holidays = items.filter((i) => i.is_holiday);

  return (
    <>
      <h2>My Availability</h2>

      <form onSubmit={handleAdd} className="availability-form">
        <div className="filter-tabs">
          <button type="button" className={mode === "recurring" ? "tab active" : "tab"} onClick={() => setMode("recurring")}>Weekly window</button>
          <button type="button" className={mode === "specific" ? "tab active" : "tab"} onClick={() => setMode("specific")}>One-off date</button>
          <button type="button" className={mode === "holiday" ? "tab active" : "tab"} onClick={() => setMode("holiday")}>Holiday</button>
        </div>

        {mode === "recurring" && (
          <label>
            Day:{" "}
            <select value={day} onChange={(e) => setDay(e.target.value)}>
              {DAYS.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
          </label>
        )}

        {mode !== "holiday" && (
          <>
            <label> Start: <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /> </label>
            <label> End: <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /> </label>
          </>
        )}

        {mode !== "recurring" && (
          <label> Date: <input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} required /> </label>
        )}

        <button type="submit" className="btn btn-small">Add</button>
        {formError && <p className="notice notice-error">{formError}</p>}
      </form>

      {recurring.length > 0 && <h3>Weekly schedule</h3>}
      {recurring.map((i) => (
        <div key={i.id} className="appointment-card">
          <span>
            {DAYS[i.day_of_week] ?? i.day_of_week}: {i.start_time?.slice(0, 5)} – {i.end_time?.slice(0, 5)}
          </span>
          <button className="btn btn-small" onClick={() => handleDelete(i.id)}>Delete</button>
        </div>
      ))}

      {oneOff.length > 0 && <h3>Extra dates</h3>}
      {oneOff.map((i) => (
        <div key={i.id} className="appointment-card">
          <span>{i.specific_date}: {i.start_time?.slice(0, 5)} – {i.end_time?.slice(0, 5)}</span>
          <button className="btn btn-small" onClick={() => handleDelete(i.id)}>Delete</button>
        </div>
      ))}

      {holidays.length > 0 && <h3>Holidays</h3>}
      {holidays.map((i) => (
        <div key={i.id} className="appointment-card">
          <span>🚫 Holiday: {i.specific_date}</span>
          <button className="btn btn-small" onClick={() => handleDelete(i.id)}>Remove</button>
        </div>
      ))}

      {items.length === 0 && <p>No availability yet. Add a weekly window to become bookable.</p>}
    </>
  );
}

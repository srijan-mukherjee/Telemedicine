import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

export const fetchTodayAppointments = () => apiGet("/doctor-panel/today");
export const fetchTodayStats = () => apiGet("/doctor-panel/stats/today");
export const fetchDoctorPatients = () => apiGet("/doctor-panel/patients");
export const fetchPatientHistory = (id) => apiGet(`/doctor-panel/patients/${id}/history`);
export const fetchMyAvailability = () => apiGet("/availability/me");
export const addAvailability = (data) => apiPost("/availability/me", data);
export const deleteAvailability = (id) => apiDelete(`/availability/me/${id}`);



export function fetchAppointments({ date, status } = {}) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (status) params.set("status", status);
  const qs = params.toString();

  let path = "/doctor-panel/appointments";
  if (qs) path = path + "?" + qs;
  return apiGet(path);
}

export function updateAppointmentStatus(id, status) {
  return apiPatch(`/doctor-panel/appointments/${id}/status`, { status });
}

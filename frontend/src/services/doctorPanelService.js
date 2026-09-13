import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from "./api";
import { API_PREFIX, getToken } from "./api";


export const fetchTodayAppointments = () => apiGet("/doctor-panel/today");
export const fetchTodayStats = () => apiGet("/doctor-panel/stats/today");
export const fetchDoctorPatients = () => apiGet("/doctor-panel/patients");
export const fetchPatientHistory = (id) => apiGet(`/doctor-panel/patients/${id}/history`);
export const fetchMyAvailability = () => apiGet("/availability/me");
export const addAvailability = (data) => apiPost("/availability/me", data);
export const deleteAvailability = (id) => apiDelete(`/availability/me/${id}`);


// Prescriptions
export const createPrescription = (appointmentId, data) =>
  apiPost(`/prescriptions/appointment/${appointmentId}`, data);

export const updatePrescription = (appointmentId, data) =>
  apiPut(`/prescriptions/appointment/${appointmentId}`, data);

export const getPrescription = (appointmentId) =>
  apiGet(`/prescriptions/appointment/${appointmentId}`);

export const fetchMyPrescriptions = () => apiGet("/prescriptions/me");

export async function downloadPrescriptionPdf(appointmentId) {
  const res = await fetch(`/api/v1/prescriptions/appointment/${appointmentId}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prescription.pdf";
  a.click();
  URL.revokeObjectURL(url);
}





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

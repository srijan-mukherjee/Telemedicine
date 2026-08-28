import { apiGet, apiPost } from './api';

export const getAvailableSlots = (doctorId, date) =>
  apiGet(`/availability/doctors/${doctorId}/slots?date=${date}`);

export const bookAppointment = (doctorId, datetime, reason) =>
  apiPost('/appointments/', { doctor_id: doctorId, appointment_datetime: datetime, reason_text: reason });

export const getMyAppointments = () =>
  apiGet('/appointments/me');   
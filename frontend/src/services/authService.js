import { apiGet, apiPost, apiPostForm } from "./api.js";

export function loginRequest(email, password) {
  const form = new URLSearchParams();
  form.set("username", email); // backend's OAuth2PasswordRequestForm uses `username` for the email
  form.set("password", password);
  return apiPostForm("/auth/login", form);
}

export function registerPatientRequest(payload) {
  return apiPost("/auth/register/patient", payload);
}

export function registerDoctorRequest(payload) {
  return apiPost("/auth/register/doctor", payload);
}

export function fetchCurrentUser() {
  return apiGet("/auth/me");
}

export function fetchSpecialties() {
  return apiGet("/specialties");
}

export function changePasswordRequest(currentPassword, newPassword) {
  return apiPost("/users/me/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

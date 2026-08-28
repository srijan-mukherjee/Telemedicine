// Thin fetch wrapper for the backend API.
// Attaches the JWT (if present) and centralizes 401 handling.

const API_PREFIX = "/api/v1";
const TOKEN_KEY = "telemedicine_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, { body, isForm } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token missing/expired/invalid — drop it so the UI can redirect to login.
    clearToken();
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // response had no JSON body — keep statusText
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const apiGet = (path) => request("GET", path);
export const apiPost = (path, body) => request("POST", path, { body });
export const apiPostForm = (path, formBody) => request("POST", path, { body: formBody, isForm: true });
export const apiPatch = (path, body) => request("PATCH", path, { body });
export const apiDelete = (path) => request("DELETE", path);


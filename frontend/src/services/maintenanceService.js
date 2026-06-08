import { apiFetch } from './api';

/** GET /api/v1/maintenance-requests — returns List (not Page) */
export async function getAllRequests(locale = 'vi') {
  return apiFetch('/maintenance-requests', {}, locale);
}

/** GET /api/v1/maintenance-requests/{id} */
export async function getRequestById(id, locale = 'vi') {
  return apiFetch(`/maintenance-requests/${id}`, {}, locale);
}

/** POST /api/v1/maintenance-requests */
export async function createRequest(payload, locale = 'vi') {
  return apiFetch('/maintenance-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

/** PUT /api/v1/maintenance-requests/{id} */
export async function updateRequest(id, payload, locale = 'vi') {
  return apiFetch(`/maintenance-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

/** DELETE /api/v1/maintenance-requests/{id} */
export async function deleteRequest(id, locale = 'vi') {
  return apiFetch(`/maintenance-requests/${id}`, { method: 'DELETE' }, locale);
}

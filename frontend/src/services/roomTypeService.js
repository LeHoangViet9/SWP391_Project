import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** GET /api/v1/room-types */
export async function getAllRoomTypes(params = {}, locale = 'vi') {
  return apiFetch(`/room-types${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/room-types/{id} */
export async function getRoomTypeById(id, locale = 'vi') {
  return apiFetch(`/room-types/${id}`, {}, locale);
}

/** POST /api/v1/room-types */
export async function createRoomType(payload, locale = 'vi') {
  return apiFetch('/room-types', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

/** PUT /api/v1/room-types/{id} */
export async function updateRoomType(id, payload, locale = 'vi') {
  return apiFetch(`/room-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

/** DELETE /api/v1/room-types/{id} — soft delete (INACTIVE) */
export async function deleteRoomType(id, locale = 'vi') {
  return apiFetch(`/room-types/${id}`, { method: 'DELETE' }, locale);
}

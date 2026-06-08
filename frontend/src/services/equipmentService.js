import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** GET /api/v1/equipments */
export async function getAllEquipments(params = {}, locale = 'vi') {
  return apiFetch(`/equipments${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/equipments/{id} */
export async function findById(id, locale = 'vi') {
  return apiFetch(`/equipments/${id}`, {}, locale);
}

/** @deprecated use findById */
export const findEquipmentById = findById;

/** POST /api/v1/equipments */
export async function createEquipment(payload, locale = 'vi') {
  return apiFetch('/equipments', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

/** PUT /api/v1/equipments/{id} */
export async function updateEquipment(id, payload, locale = 'vi') {
  return apiFetch(`/equipments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

/** DELETE /api/v1/equipments/{id} */
export async function deleteEquipment(id, locale = 'vi') {
  return apiFetch(`/equipments/${id}`, { method: 'DELETE' }, locale);
}

import { apiFetch, apiFormData } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** GET /api/v1/rooms */
export async function getAllRooms(params = {}, locale = 'vi') {
  return apiFetch(`/rooms${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/rooms/{id} */
export async function getRoomById(id, locale = 'vi') {
  return apiFetch(`/rooms/${id}`, {}, locale);
}

/** POST /api/v1/rooms — multipart @ModelAttribute + file */
export async function createRoom(roomRequest, file, locale = 'vi') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('roomNumber', roomRequest.roomNumber);
  formData.append('roomTypeId', String(roomRequest.roomTypeId));
  formData.append('floorNumber', String(roomRequest.floorNumber));
  if (roomRequest.description) formData.append('description', roomRequest.description);
  if (roomRequest.imageRoom) formData.append('imageRoom', roomRequest.imageRoom);
  return apiFormData('/rooms', formData, locale, 'POST');
}

/**
 * PUT /api/v1/rooms/{id}
 * Backend yêu cầu @RequestParam file + @RequestBody JSON.
 * Ưu tiên gửi JSON; nếu có file mới, gửi kèm qua FormData fallback.
 */
export async function updateRoom(id, roomRequest, file, locale = 'vi') {
  const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
  const headers = {
    'Accept-Language': locale === 'vi' ? 'vi-VN' : 'en-US',
    Authorization: `Bearer ${localStorage.getItem('hms_token') || ''}`,
  };

  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(roomRequest).forEach(([key, value]) => {
      if (value != null) formData.append(key, String(value));
    });
    return apiFormData(`/rooms/${id}`, formData, locale, 'PUT');
  }

  const response = await fetch(`${API_BASE}/rooms/${id}?file=`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(roomRequest),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** DELETE /api/v1/rooms/{id} — soft delete (INACTIVE) */
export async function deleteRoom(id, locale = 'vi') {
  return apiFetch(`/rooms/${id}`, { method: 'DELETE' }, locale);
}

/** GET /api/v1/rooms/status/{status} */
export async function getRoomsByStatus(status, params = {}, locale = 'vi') {
  return apiFetch(`/rooms/status/${status}${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/rooms/floor/{floorNumber} */
export async function getRoomsByFloor(floorNumber, params = {}, locale = 'vi') {
  return apiFetch(`/rooms/floor/${floorNumber}${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/rooms/room-type/{roomTypeId} */
export async function getRoomsByRoomType(roomTypeId, params = {}, locale = 'vi') {
  return apiFetch(`/rooms/room-type/${roomTypeId}${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/rooms/available */
export async function getAvailableRooms(params = {}, locale = 'vi') {
  return apiFetch(`/rooms/available${buildQuery(params)}`, {}, locale);
}

/** PATCH /api/v1/rooms/{id}/status */
export async function updateRoomStatus(id, status, locale = 'vi') {
  return apiFetch(`/rooms/${id}/status?status=${status}`, { method: 'PATCH' }, locale);
}

/** GET /api/v1/room-types — alias for backward compatibility */
export async function getRoomTypes(params = {}, locale = 'vi') {
  return apiFetch(`/room-types${buildQuery(params)}`, {}, locale);
}

export async function getRoomTypeById(id, locale = 'vi') {
  return apiFetch(`/room-types/${id}`, {}, locale);
}

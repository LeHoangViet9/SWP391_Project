import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function getAllRooms(params = {}, locale = 'vi') {
  return apiFetch(`/rooms${buildQuery(params)}`, {}, locale);
}

export async function getRoomById(id, locale = 'vi') {
  return apiFetch(`/rooms/${id}`, {}, locale);
}

export async function createRoom(roomRequest, locale = 'vi') {
  return apiFetch('/rooms', {
    method: 'POST',
    body: JSON.stringify(roomRequest),
  }, locale);
}

export async function updateRoom(id, roomRequest, locale = 'vi') {
  return apiFetch(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(roomRequest),
  }, locale);
}

export async function deleteRoom(id, locale = 'vi') {
  return apiFetch(`/rooms/${id}`, { method: 'DELETE' }, locale);
}

export async function getRoomsByStatus(status, params = {}, locale = 'vi') {
  return apiFetch(`/rooms/status/${status}${buildQuery(params)}`, {}, locale);
}

export async function getRoomsByFloor(floorNumber, params = {}, locale = 'vi') {
  return apiFetch(`/rooms/floor/${floorNumber}${buildQuery(params)}`, {}, locale);
}

export async function getRoomsByRoomType(roomTypeId, params = {}, locale = 'vi') {
  return apiFetch(`/rooms/room-type/${roomTypeId}${buildQuery(params)}`, {}, locale);
}

export async function getAvailableRooms(params = {}, locale = 'vi') {
  return apiFetch(`/rooms/available${buildQuery(params)}`, {}, locale);
}

export async function getRoomTypes(params = {}, locale = 'vi') {
  return apiFetch(`/room-types${buildQuery(params)}`, {}, locale);
}

export async function getRoomTypeById(id, locale = 'vi') {
  return apiFetch(`/room-types/${id}`, {}, locale);
}

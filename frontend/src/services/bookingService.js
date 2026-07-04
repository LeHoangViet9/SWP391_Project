import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** GET /api/v1/bookings */
export async function getAllBookings(params = {}, locale = 'vi') {
  return apiFetch(`/bookings${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/bookings/search */
export async function searchBookings(params = {}, locale = 'vi') {
  return apiFetch(`/bookings/search${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/bookings/my-history */
export async function getMyBookingHistory(params = {}, locale = 'vi') {
  return apiFetch(`/bookings/my-history${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/bookings/{id} */
export async function getBookingById(id, locale = 'vi') {
  return apiFetch(`/bookings/${id}`, {}, locale);
}

/** POST /api/v1/bookings */
export async function createBooking(payload, locale = 'vi') {
  return apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

/** GET concrete rooms that can be added to the cart for the selected stay. */
export async function getAvailableRooms(params, locale = 'vi') {
  return apiFetch(`/bookings/available-rooms${buildQuery(params)}`, {}, locale);
}

/** PUT /api/v1/bookings/{id} */
export async function updateBooking(id, payload, locale = 'vi') {
  return apiFetch(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

/** DELETE /api/v1/bookings/{id} */
export async function deleteBooking(id, locale = 'vi') {
  return apiFetch(`/bookings/${id}`, { method: 'DELETE' }, locale);
}

/** PATCH /api/v1/bookings/{id}/status */
export async function updateBookingStatus(id, payload, locale = 'vi') {
  return apiFetch(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, locale);
}

/** PATCH /api/v1/bookings/{id}/assign-room */
export async function assignRoom(id, payload, locale = 'vi') {
  return apiFetch(`/bookings/${id}/assign-room`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, locale);
}

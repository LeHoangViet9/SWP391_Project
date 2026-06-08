import { apiFetch } from './api';

/** POST /api/v1/bookings */
export async function createBooking(payload, locale = 'vi') {
  return apiFetch('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

/** GET /api/v1/bookings/{id} */
export async function getBookingById(id, locale = 'vi') {
  return apiFetch(`/bookings/${id}`, {}, locale);
}

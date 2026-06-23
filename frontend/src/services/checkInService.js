import { apiFetch } from './api';

/** GET /api/v1/checkin/available-rooms/{bookingId} */
export async function getAvailableRoomsForCheckIn(bookingId, locale = 'vi') {
  return apiFetch(`/checkin/available-rooms/${bookingId}`, {}, locale);
}

/** POST /api/v1/checkin */
export async function processCheckIn(payload, locale = 'vi') {
  return apiFetch('/checkin', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

import { apiFetch } from './api';

/**
 * GET /api/v1/rooms/available
 * Spring Boot returns ApiResponse<Page<RoomResponse>>
 */
export async function getAvailableRooms(params = {}, locale = 'vi') {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set('page', params.page);
  if (params.size != null) searchParams.set('size', params.size);
  if (params.hotelId) searchParams.set('hotelId', params.hotelId);
  if (params.checkIn) searchParams.set('checkIn', params.checkIn);
  if (params.checkOut) searchParams.set('checkOut', params.checkOut);
  if (params.adults) searchParams.set('adults', params.adults);
  if (params.children) searchParams.set('children', params.children);
  if (params.promoCode) searchParams.set('promoCode', params.promoCode);

  const query = searchParams.toString();
  return apiFetch(`/rooms/available${query ? `?${query}` : ''}`, {}, locale);
}

/**
 * GET /api/v1/room-types/{id}
 */
export async function getRoomTypeById(id, locale = 'vi') {
  return apiFetch(`/room-types/${id}`, {}, locale);
}

/**
 * GET /api/v1/room-types
 */
export async function getRoomTypes(params = {}, locale = 'vi') {
  const searchParams = new URLSearchParams();
  if (params.keywords) searchParams.set('keywords', params.keywords);
  if (params.maxGuests) searchParams.set('maxGuests', params.maxGuests);
  if (params.page != null) searchParams.set('page', params.page);
  if (params.size != null) searchParams.set('size', params.size);

  const query = searchParams.toString();
  return apiFetch(`/room-types${query ? `?${query}` : ''}`, {}, locale);
}

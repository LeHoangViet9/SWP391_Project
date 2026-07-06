import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** GET /api/v1/housekeeping/dirty-rooms */
export async function getDirtyRooms(params = {}, locale = 'vi') {
  return apiFetch(`/housekeeping/dirty-rooms${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/housekeeping/cleaning-rooms */
export async function getCleaningRooms(params = {}, locale = 'vi') {
  return apiFetch(`/housekeeping/cleaning-rooms${buildQuery(params)}`, {}, locale);
}

/**
 * PATCH /api/v1/housekeeping/rooms/{id}/status?status=CLEANING|READY|AVAILABLE
 * Cập nhật trạng thái phòng trong luồng dọn phòng
 */
export async function updateRoomCleaningStatus(roomId, status, locale = 'vi') {
  return apiFetch(`/housekeeping/rooms/${roomId}/status?status=${status}`, { method: 'PATCH' }, locale);
}

/** GET /api/v1/invoices/booking/{bookingId} */
export async function getInvoiceByBookingId(bookingId, locale = 'vi') {
  return apiFetch(`/invoices/booking/${bookingId}`, {}, locale);
}

/** POST /api/v1/invoices/{id}/pay */
export async function payInvoice(invoiceId, paymentMethod, locale = 'vi') {
  return apiFetch(`/invoices/${invoiceId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  }, locale);
}

// Housekeeping Tasks API calls
export async function searchTasks(params = {}, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/search${buildQuery(params)}`, {}, locale);
}

export async function getTaskById(id, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/${id}`, {}, locale);
}

export async function getPendingTasksByRoom(roomId, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/pending/room/${roomId}`, {}, locale);
}

export async function getUncompletedByUser(userId, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/uncompleted/user/${userId}`, {}, locale);
}

export async function getRoomStateHistory(roomId, params = {}, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/rooms/${roomId}/state-history${buildQuery(params)}`, {}, locale);
}

export async function createTask(payload, locale = 'vi') {
  return apiFetch('/housekeeping-tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, locale);
}

export async function updateTask(id, payload, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/updateTask/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  }, locale);
}

export async function deleteTask(id, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/deleteTask/${id}`, {
    method: 'DELETE'
  }, locale);
}

export async function reportRoomIssue(roomId, payload, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/rooms/${roomId}/report-issue`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, locale);
}

export async function reportMinibar(taskId, payload, locale = 'vi') {
  return apiFetch(`/housekeeping-tasks/${taskId}/report-minibar`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, locale);
}

// Exported wrapper object for components importing { housekeepingService }
export const housekeepingService = {
  getDirtyRooms,
  getCleaningRooms,
  updateRoomCleaningStatus,
  getInvoiceByBookingId,
  payInvoice,
  searchTasks,
  getTaskById,
  getPendingTasksByRoom,
  getUncompletedByUser,
  getRoomStateHistory,
  createTask,
  updateTask,
  deleteTask,
  reportRoomIssue,
  reportMinibar
};

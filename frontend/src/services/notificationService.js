import { apiFetch } from './api';

export function getNotifications(limit = 10, locale = 'en') {
  return apiFetch(`/notifications?limit=${limit}`, {}, locale);
}

export function getUnreadCount(locale = 'en') {
  return apiFetch('/notifications/unread-count', {}, locale);
}

export function markNotificationRead(id, locale = 'en') {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }, locale);
}

export const notificationService = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
};

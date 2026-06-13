import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getUsers(params = {}, locale = 'vi') {
  return apiFetch(`/users${buildQuery(params)}`, {}, locale);
}

export function createUser(payload, locale = 'vi') {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

export function updateUser(id, payload, locale = 'vi') {
  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

export function deleteUser(id, locale = 'vi') {
  return apiFetch(`/users/${id}`, { method: 'DELETE' }, locale);
}

export function requestPasswordChangeOtp(locale = 'vi') {
  return apiFetch('/users/change-password-otp', { method: 'POST' }, locale);
}

export function changePassword(payload, locale = 'vi') {
  return apiFetch('/users/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

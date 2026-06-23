import { apiFetch } from './api';

export function getRoles(locale = 'vi') {
  return apiFetch('/roles', {}, locale);
}

export function getRoleById(id, locale = 'vi') {
  return apiFetch(`/roles/${id}`, {}, locale);
}

export function createRole(payload, locale = 'vi') {
  return apiFetch('/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

export function updateRole(id, payload, locale = 'vi') {
  return apiFetch(`/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

export function deleteRole(id, locale = 'vi') {
  return apiFetch(`/roles/${id}`, {
    method: 'DELETE',
  }, locale);
}

export function assignPermissionsToRole(roleId, permissionIds, locale = 'vi') {
  return apiFetch(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify(permissionIds),
  }, locale);
}

export function getPermissions(locale = 'vi') {
  return apiFetch('/permissions', {}, locale);
}

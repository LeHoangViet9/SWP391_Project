import { apiFetch } from './api';

export function getRoles(locale = 'vi') {
  return apiFetch('/roles', {}, locale);
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

import { apiFetch } from './api';

export function getRoles(locale = 'en') {
  return apiFetch('/roles', {}, locale);
}

export function assignPermissionsToRole(roleId, permissionIds, locale = 'en') {
  return apiFetch(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify(permissionIds),
  }, locale);
}

export function getPermissions(locale = 'en') {
  return apiFetch('/permissions', {}, locale);
}

import { apiFetch } from './api';

export const maintenanceService = {
  getAll: (locale = 'vi') =>
    apiFetch('/maintenance-requests', {}, locale),

  getById: (id, locale = 'vi') =>
    apiFetch(`/maintenance-requests/${id}`, {}, locale),

  create: (dto, locale = 'vi') =>
    apiFetch('/maintenance-requests', { method: 'POST', body: JSON.stringify(dto) }, locale),

  update: (id, dto, locale = 'vi') =>
    apiFetch(`/maintenance-requests/${id}`, { method: 'PUT', body: JSON.stringify(dto) }, locale),

  delete: (id, locale = 'vi') =>
    apiFetch(`/maintenance-requests/${id}`, { method: 'DELETE' }, locale),
};

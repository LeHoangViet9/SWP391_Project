import { apiFetch } from './api';

export const maintenanceService = {
  getAll: (params = {}, locale = 'vi') => {
    const q = new URLSearchParams();
    if (params.id) q.set('id', params.id);
    if (params.issueTitle) q.set('issueTitle', params.issueTitle);
    if (params.roomId) q.set('roomId', params.roomId);
    if (params.equipmentId) q.set('equipmentId', params.equipmentId);
    if (params.reportedBy) q.set('reportedBy', params.reportedBy);
    if (params.assignedTo) q.set('assignedTo', params.assignedTo);
    if (params.severity) q.set('severity', params.severity);
    if (params.status) q.set('status', params.status);
    if (params.page != null) q.set('page', params.page);
    if (params.size != null) q.set('size', params.size);
    q.set('sortBy', params.sortBy || 'ID');
    q.set('direction', params.direction || 'ASC');
    return apiFetch(`/maintenance-requests?${q}`, {}, locale);
  },

  getById: (id, locale = 'vi') =>
    apiFetch(`/maintenance-requests/${id}`, {}, locale),

  create: (dto, locale = 'vi') =>
    apiFetch('/maintenance-requests', { method: 'POST', body: JSON.stringify(dto) }, locale),

  update: (id, dto, locale = 'vi') =>
    apiFetch(`/maintenance-requests/${id}`, { method: 'PUT', body: JSON.stringify(dto) }, locale),

  delete: (id, locale = 'vi') =>
    apiFetch(`/maintenance-requests/${id}`, { method: 'DELETE' }, locale),
};

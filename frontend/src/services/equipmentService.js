import { apiFetch } from './api';

export const equipmentService = {
  getAll: (params = {}, locale = 'vi') => {
    const q = new URLSearchParams();
    if (params.id) q.set('id', params.id);
    if (params.equipmentName) q.set('equipmentName', params.equipmentName);
    if (params.equipmentCode) q.set('equipmentCode', params.equipmentCode);
    if (params.location) q.set('location', params.location);
    if (params.roomId) q.set('roomId', params.roomId);
    if (params.status) q.set('status', params.status);
    if (params.page != null) q.set('page', params.page);
    if (params.size != null) q.set('size', params.size);
    q.set('sortBy', params.sortBy || 'ID');
    q.set('direction', params.direction || 'ASC');
    return apiFetch(`/equipments?${q}`, {}, locale);
  },

  getById: (id, locale = 'vi') =>
    apiFetch(`/equipments/${id}`, {}, locale),

  create: (dto, locale = 'vi') =>
    apiFetch('/equipments', { method: 'POST', body: JSON.stringify(dto) }, locale),

  update: (id, dto, locale = 'vi') =>
    apiFetch(`/equipments/${id}`, { method: 'PUT', body: JSON.stringify(dto) }, locale),

  delete: (id, locale = 'vi') =>
    apiFetch(`/equipments/${id}`, { method: 'DELETE' }, locale),
};

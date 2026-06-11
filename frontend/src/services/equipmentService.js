import { apiFetch, apiFormData } from './api';

export const equipmentService = {
  getAll: (params = {}, locale = 'vi') => {
    const q = new URLSearchParams();

    if (params.id) q.set('id', params.id);
    if (params.equipmentName) q.set('equipmentName', params.equipmentName);
    if (params.equipmentCode) q.set('equipmentCode', params.equipmentCode);


    // GIỮ TẠM:
    // backend vẫn hỗ trợ filter theo roomId thông qua room_equipments
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
      apiFetch('/equipments', {
        method: 'POST',
        body: JSON.stringify(dto),
      }, locale),

  update: (id, dto, locale = 'vi') =>
      apiFetch(`/equipments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      }, locale),

  delete: (id, locale = 'vi') =>
      apiFetch(`/equipments/${id}`, {
        method: 'DELETE',
      }, locale),

  // SỬA MỚI:
  // Upload ảnh local cho equipment.
  // Dùng apiFormData để KHÔNG set Content-Type: application/json.
  uploadImage: (equipmentId, imageFile, isPrimary = true, locale = 'vi') => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('isPrimary', String(isPrimary));

    return apiFormData(
        `/equipments/${equipmentId}/images`,
        formData,
        locale,
        'POST'
    );
  },

  // SỬA MỚI:
  // Gán equipment vào phòng.
  assignToRoom: (equipmentId, dto, locale = 'vi') =>
      apiFetch(`/equipments/${equipmentId}/assign-room`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }, locale),

  // SỬA MỚI:
  // Lấy danh sách equipment theo phòng.
  getByRoom: (roomId, locale = 'vi') =>
      apiFetch(`/equipments/rooms/${roomId}`, {}, locale),

  // SỬA MỚI:
  // Gỡ equipment khỏi phòng.
  removeFromRoom: (equipmentId, roomId, locale = 'vi') =>
      apiFetch(`/equipments/${equipmentId}/rooms/${roomId}`, {
        method: 'DELETE',
      }, locale),
};
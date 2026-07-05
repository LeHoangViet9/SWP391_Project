import { apiFetch, apiFormData } from './api';

export const equipmentService = {
    getAll: (params = {}, locale = 'vi') => {
        const q = new URLSearchParams();

        if (params.id) q.set('id', params.id);
        if (params.equipmentName) q.set('equipmentName', params.equipmentName);
        if (params.equipmentCode) q.set('equipmentCode', params.equipmentCode);

        // Backend filter theo roomId thông qua bảng room_equipments
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

    // Upload nhiều ảnh local cho equipment.
    // Backend nhận key là "images".
    uploadImages: (equipmentId, imageFiles = [], locale = 'vi') => {
        const formData = new FormData();

        imageFiles.forEach((file) => {
            formData.append('images', file);
        });

        return apiFormData(
            `/equipments/${equipmentId}/images`,
            formData,
            locale,
            'POST'
        );
    },

    // Gán equipment vào phòng.
    assignToRoom: (equipmentId, dto, locale = 'vi') =>
        apiFetch(`/equipments/${equipmentId}/assign-room`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }, locale),

    // Lấy danh sách equipment theo phòng.
    getByRoom: (roomId, locale = 'vi') =>
        apiFetch(`/equipments/rooms/${roomId}`, {}, locale),

    // Gỡ equipment khỏi phòng.
    removeFromRoom: (equipmentId, roomId, locale = 'vi') =>
        apiFetch(`/equipments/${equipmentId}/rooms/${roomId}`, {
            method: 'DELETE',
        }, locale),

    // Gán thiết bị vào phòng hàng loạt.
    assignBulkToRoom: (roomId, dtos = [], locale = 'vi') =>
        apiFetch(`/equipments/rooms/${roomId}/assign-bulk`, {
            method: 'POST',
            body: JSON.stringify(dtos),
        }, locale),
};
import { apiFetch, apiFormData } from './api';

export const equipmentService = {
    getAll: (params = {}, locale = 'en') => {
        const q = new URLSearchParams();

        if (params.keyword) q.set('keyword', params.keyword);

        if (params.status) q.set('status', params.status);
        if (params.page != null) q.set('page', params.page);
        if (params.size != null) q.set('size', params.size);

        q.set('sortBy', params.sortBy || 'ID');
        q.set('direction', params.direction || 'ASC');

        return apiFetch(`/equipments?${q}`, {}, locale);
    },

    getById: (id, locale = 'en') =>
        apiFetch(`/equipments/${id}`, {}, locale),

    create: (dto, locale = 'en') =>
        apiFetch('/equipments', {
            method: 'POST',
            body: JSON.stringify(dto),
        }, locale),

    update: (id, dto, locale = 'en') =>
        apiFetch(`/equipments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dto),
        }, locale),

    delete: (id, locale = 'en') =>
        apiFetch(`/equipments/${id}`, {
            method: 'DELETE',
        }, locale),

    // Upload multiple local images for equipment.
    // Backend accepts key "images".
    uploadImages: (equipmentId, imageFiles = [], locale = 'en') => {
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

    // Assign equipment to a room.
    assignToRoom: (equipmentId, dto, locale = 'en') =>
        apiFetch(`/equipments/${equipmentId}/assign-room`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }, locale),

    // Get equipment list by room.
    getByRoom: (roomId, locale = 'en') =>
        apiFetch(`/equipments/rooms/${roomId}`, {}, locale),

    // Remove equipment from a room.
    removeFromRoom: (equipmentId, roomId, locale = 'en') =>
        apiFetch(`/equipments/${equipmentId}/rooms/${roomId}`, {
            method: 'DELETE',
        }, locale),

    // Bulk assign equipment to a room.
    assignBulkToRoom: (roomId, dtos = [], locale = 'en') =>
        apiFetch(`/equipments/rooms/${roomId}/assign-bulk`, {
            method: 'POST',
            body: JSON.stringify(dtos),
        }, locale),
};

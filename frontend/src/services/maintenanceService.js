import { apiFetch } from './api';

export const maintenanceService = {
    getAll: (params = {}, locale = 'en') => {
        const q = new URLSearchParams();

        // FIX: Consolidate all search types into a single 'keyword' param to match backend.
        // Previously: Sent separate params (id, issueTitle, roomId...) but backend only accepts 'keyword'
        // After fix: Unified 'keyword' for all search types.
        if (params.keyword) q.set('keyword', params.keyword);
        if (params.severity) q.set('severity', params.severity);
        if (params.status) q.set('status', params.status);

        if (params.page != null) q.set('page', params.page);
        if (params.size != null) q.set('size', params.size);

        // FIX: Default sort by creation date (CREATED_AT) with newest first (DESC)
        q.set('sortBy', params.sortBy || 'CREATED_AT');
        q.set('direction', params.direction || 'DESC');

        const query = q.toString();

        return apiFetch(
            `/maintenance-requests${query ? `?${query}` : ''}`,
            {},
            locale
        );
    },

    getById: (id, locale = 'en') =>
        apiFetch(`/maintenance-requests/${id}`, {}, locale),

    create: (dto, locale = 'en') =>
        apiFetch(
            '/maintenance-requests',
            {
                method: 'POST',
                body: JSON.stringify(dto),
            },
            locale
        ),

    update: (id, dto, locale = 'en') =>
        apiFetch(
            `/maintenance-requests/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify(dto),
            },
            locale
        ),

    delete: (id, locale = 'en') =>
        apiFetch(
            `/maintenance-requests/${id}`,
            {
                method: 'DELETE',
            },
            locale
        ),

    /**
     * Maintenance staff accepts request → IN_PROGRESS
     */
    acceptRequest: (id, locale = 'en') =>
        apiFetch(
            `/maintenance-requests/${id}/accept`,
            { method: 'POST' },
            locale
        ),

    /**
     * Maintenance staff denies request → system assigns to next person
     */
    // FIX: Send denial reason to server if provided
    denyRequest: (id, reason, locale = 'en') => {
        const params = new URLSearchParams();
        if (reason && reason.trim()) params.set('reason', reason.trim());
        return apiFetch(
            `/maintenance-requests/${id}/deny?${params.toString()}`,
            { method: 'POST' },
            locale
        );
    },
};

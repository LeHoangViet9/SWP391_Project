import { apiFetch } from './api';

export const maintenanceService = {
  getAll: (params = {}, locale = 'vi') => {
    const q = new URLSearchParams();

    // THAY ĐỔI: Gộp tất cả loại tìm kiếm vào 1 param 'keyword' để khớp với backend.
    // Trước đây: Gửi túng param riêng (id, issueTitle, roomId...) nhưng backend chỉ nhận 'keyword'
    // Sau khi sửa: Thống nhất gửi 'keyword' cho mọi loại tìm kiếm.
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.severity) q.set('severity', params.severity);
    if (params.status) q.set('status', params.status);

    if (params.page != null) q.set('page', params.page);
    if (params.size != null) q.set('size', params.size);

    // THAY ĐỔI: Sửa mặc định sắp xếp theo ngày tạo (CREATED_AT) và mới nhất trước (DESC)
    q.set('sortBy', params.sortBy || 'CREATED_AT');
    q.set('direction', params.direction || 'DESC');

    const query = q.toString();

    return apiFetch(
        `/maintenance-requests${query ? `?${query}` : ''}`,
        {},
        locale
    );
  },

  getById: (id, locale = 'vi') =>
      apiFetch(`/maintenance-requests/${id}`, {}, locale),

  create: (dto, locale = 'vi') =>
      apiFetch(
          '/maintenance-requests',
          {
            method: 'POST',
            body: JSON.stringify(dto),
          },
          locale
      ),

  update: (id, dto, locale = 'vi') =>
      apiFetch(
          `/maintenance-requests/${id}`,
          {
            method: 'PUT',
            body: JSON.stringify(dto),
          },
          locale
      ),

  delete: (id, locale = 'vi') =>
      apiFetch(
          `/maintenance-requests/${id}`,
          {
            method: 'DELETE',
          },
          locale
      ),

  /**
   * Maintenance staff chấp nhận yêu cầu → IN_PROGRESS
   */
  acceptRequest: (id, userId, locale = 'vi') =>
      apiFetch(
          `/maintenance-requests/${id}/accept?userId=${userId}`,
          { method: 'POST' },
          locale
      ),

  /**
   * Maintenance staff từ chối yêu cầu → hệ thống giao cho người tiếp theo
   */
  // THAY ĐỔI: Gửi kèm lý do từ chối (reason) nếu có lên server
  denyRequest: (id, userId, reason, locale = 'vi') => {
    const params = new URLSearchParams({ userId });
    if (reason && reason.trim()) params.set('reason', reason.trim());
    return apiFetch(
        `/maintenance-requests/${id}/deny?${params.toString()}`,
        { method: 'POST' },
        locale
    );
  },
};
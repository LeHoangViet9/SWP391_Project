import { apiFetch } from './api';

export const invoiceService = {
  /** Lấy danh sách hóa đơn với các bộ lọc */
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/invoices?${query}`);
  },

  /** Lấy chi tiết hóa đơn */
  getById: async (id) => {
    return apiFetch(`/invoices/${id}`);
  },

  /** Tạo hóa đơn mới */
  create: async (data) => {
    return apiFetch('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Cập nhật hóa đơn */
  update: async (id, data) => {
    return apiFetch(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** Tìm kiếm hóa đơn động */
  search: async (term) => {
    return apiFetch(`/invoices/search?term=${term}`);
  },

  /** Xác nhận thanh toán */
  processPayment: async (id, paymentMethod) => {
    return apiFetch(`/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  }
};

import { apiFetch } from './api';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/** GET /api/v1/invoices/booking/{bookingId} */
export async function getInvoiceByBookingId(bookingId, locale = 'vi') {
  return apiFetch(`/invoices/booking/${bookingId}`, {}, locale);
}

/** POST /api/v1/invoices/{id}/pay */
export async function payInvoice(invoiceId, paymentMethod, locale = 'vi') {
  return apiFetch(`/invoices/${invoiceId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  }, locale);
}

/** GET /api/v1/invoices/{id} */
export async function getInvoiceById(invoiceId, locale = 'vi') {
  return apiFetch(`/invoices/${invoiceId}`, {}, locale);
}

/** GET /api/v1/invoices/search */
export async function searchInvoices(params = {}, locale = 'vi') {
  return apiFetch(`/invoices/search${buildQuery(params)}`, {}, locale);
}

/** POST /api/v1/invoices/{id}/mark-as-paid */
export async function markAsPaid(id, paymentMethod, locale = 'vi') {
  return apiFetch(`/invoices/${id}/mark-as-paid`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  }, locale);
}

/** POST /api/v1/invoices/{id}/payos-link */
export async function createPayOsPaymentLink(id, locale = 'vi') {
  return apiFetch(`/invoices/${id}/payos-link`, {
    method: 'POST',
  }, locale);
}

/** GET /api/v1/invoices/payos/sync/{orderCode} */
export async function syncPayOsPaymentStatus(orderCode, locale = 'vi') {
  return apiFetch(`/invoices/payos/sync/${orderCode}`, {}, locale);
}

/** POST /api/v1/invoices/{id}/process-payments */
export async function processPayments(id, paymentMethod, locale = 'vi') {
  return apiFetch(`/invoices/${id}/process-payments`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  }, locale);
}

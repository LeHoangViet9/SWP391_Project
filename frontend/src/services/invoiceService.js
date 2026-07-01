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

function buildBookingIdsQuery(bookingIds) {
  const params = new URLSearchParams();
  bookingIds.forEach(id => params.append('bookingIds', id));
  return params.toString();
}

/** GET one combined payment invoice for multiple bookings. */
export async function getCombinedInvoice(bookingIds, locale = 'vi') {
  return apiFetch(`/invoices/batch?${buildBookingIdsQuery(bookingIds)}`, {}, locale);
}

/** Confirm one payment for every booking in a combined invoice. */
export async function confirmCombinedInvoicePayment(bookingIds, locale = 'vi') {
  return apiFetch(`/invoices/batch/webhook/payment-success?${buildBookingIdsQuery(bookingIds)}`, {
    method: 'POST',
  }, locale);
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

/** POST /api/v1/invoices/{id}/process-payments */
export async function processPayments(id, paymentMethod, locale = 'vi') {
  return apiFetch(`/invoices/${id}/process-payments`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  }, locale);
}

/**
 * POST /api/v1/invoices/batch/pay-at-desk?bookingIds=1&bookingIds=2...
 * Process receptionist payment for one or more bookings.
 * bookingIds go as @RequestParam query params; the rest go in the JSON body.
 * @param {number[]} bookingIds
 * @param {'CASH'|'CARD'|'TRANSFER'} paymentMethod
 * @param {number|null} cashReceived - required for CASH
 * @param {boolean} paymentConfirmed - required for CARD/TRANSFER
 */
export async function processReceptionistPayment(bookingIds, paymentMethod, cashReceived = null, paymentConfirmed = false, locale = 'vi') {
  const params = new URLSearchParams();
  bookingIds.forEach(id => params.append('bookingIds', id));
  return apiFetch(`/invoices/batch/pay-at-desk?${params.toString()}`, {
    method: 'POST',
    body: JSON.stringify({
      paymentMethod,
      cashReceived,
      paymentConfirmed,
    }),
  }, locale);
}

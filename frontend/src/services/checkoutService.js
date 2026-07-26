import { apiFetch } from './api';

export function getCheckoutBill(bookingId, locale = 'en') {
  return apiFetch(`/checkout/${bookingId}/bill`, {}, locale);
}

export function confirmCheckoutPayment(payload, locale = 'en') {
  return apiFetch('/checkout/confirm-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
}

export function releaseCheckoutRoom(bookingId, locale = 'en') {
  return apiFetch(`/checkout/${bookingId}/release-room`, { method: 'POST' }, locale);
}

import { apiFetch } from './api';

const CUSTOMER_ID_KEY = 'hms_customer_id';

export function getStoredCustomerId() {
  return localStorage.getItem(CUSTOMER_ID_KEY);
}

export function saveCustomerId(id) {
  localStorage.setItem(CUSTOMER_ID_KEY, String(id));
}

/** POST /api/v1/customers */
export async function createCustomer(payload, locale = 'vi') {
  const res = await apiFetch('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, locale);
  if (res?.data?.id) saveCustomerId(res.data.id);
  return res;
}

/** GET /api/v1/customers?keywords=email */
export async function searchCustomerByEmail(email, locale = 'vi') {
  const res = await apiFetch(`/customers?keywords=${encodeURIComponent(email)}&size=1`, {}, locale);
  return res?.data?.content?.[0] ?? null;
}

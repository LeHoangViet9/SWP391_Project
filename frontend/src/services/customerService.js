import { apiFetch } from './api';

const CUSTOMER_ID_KEY = 'hms_customer_id';

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getStoredCustomerId() {
  return localStorage.getItem(CUSTOMER_ID_KEY);
}

export function saveCustomerId(id) {
  localStorage.setItem(CUSTOMER_ID_KEY, String(id));
}

/** GET /api/v1/customers */
export async function getCustomers(params = {}, locale = 'vi') {
  return apiFetch(`/customers${buildQuery(params)}`, {}, locale);
}

/** GET /api/v1/customers/{id} */
export async function getCustomerById(id, locale = 'vi') {
  return apiFetch(`/customers/${id}`, {}, locale);
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

/** PUT /api/v1/customers/{id} */
export async function updateCustomer(id, payload, locale = 'vi') {
  return apiFetch(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, locale);
}

/** DELETE /api/v1/customers/{id} */
export async function deleteCustomer(id, locale = 'vi') {
  return apiFetch(`/customers/${id}`, { method: 'DELETE' }, locale);
}

/** PUT /api/v1/customers/{id}/restore */
export async function restoreCustomer(id, locale = 'vi') {
  return apiFetch(`/customers/${id}/restore`, { method: 'PUT' }, locale);
}

/** DELETE /api/v1/customers/{id}/force */
export async function forceDeleteCustomer(id, locale = 'vi') {
  return apiFetch(`/customers/${id}/force`, { method: 'DELETE' }, locale);
}


/** GET /api/v1/customers?keywords=email */
export async function searchCustomerByEmail(email, locale = 'vi') {
  const res = await apiFetch(`/customers?keywords=${encodeURIComponent(email)}&size=1`, {}, locale);
  return res?.data?.content?.[0] ?? null;
}

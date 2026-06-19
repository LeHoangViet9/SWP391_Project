const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

function buildAuthHeaders(locale, extraHeaders = {}, includeJson = true) {
  const acceptLanguage = locale === 'vi' ? 'vi-VN' : 'en-US';
  const token = localStorage.getItem('hms_token');
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    'Accept-Language': acceptLanguage,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    if (response.status === 401) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify-otp') && !window.location.pathname.includes('/register')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Central fetch wrapper — attaches Accept-Language header for Spring Boot i18n.
 */
export async function apiFetch(endpoint, options = {}, locale = 'vi') {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: buildAuthHeaders(locale, options.headers, true),
  });
  return handleResponse(response);
}

/**
 * Multipart POST (e.g. Room create with @ModelAttribute).
 */
export async function apiFormData(endpoint, formData, locale = 'vi', method = 'POST') {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: buildAuthHeaders(locale, {}, false),
    body: formData,
  });
  return handleResponse(response);
}


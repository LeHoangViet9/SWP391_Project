const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

/**
 * Central fetch wrapper — attaches Accept-Language header for Spring Boot i18n.
 */
export async function apiFetch(endpoint, options = {}, locale = 'vi') {
  const acceptLanguage = locale === 'vi' ? 'vi-VN' : 'en-US';
  const token = localStorage.getItem('hms_token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': acceptLanguage,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

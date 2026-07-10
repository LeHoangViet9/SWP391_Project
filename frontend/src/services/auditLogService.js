import { apiFetch } from './api';

export function getAuditLogs(filters = {}, locale = 'vi') {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const query = params.toString();
  return apiFetch(`/audit-logs${query ? `?${query}` : ''}`, {}, locale);
}

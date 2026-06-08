import { apiFetch } from './api';

/** GET /api/v1/dashboards/admin */
export async function getAdminDashboard(locale = 'vi') {
  return apiFetch('/dashboards/admin', {}, locale);
}

/** GET /api/v1/dashboards/receptionist */
export async function getReceptionistDashboard(locale = 'vi') {
  return apiFetch('/dashboards/receptionist', {}, locale);
}

/** GET /api/v1/dashboards/maintenance */
export async function getMaintenanceDashboard(locale = 'vi') {
  return apiFetch('/dashboards/maintenance', {}, locale);
}

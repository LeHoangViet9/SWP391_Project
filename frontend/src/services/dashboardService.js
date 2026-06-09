import axiosClient from './axiosClient';

export async function getAdminDashboard() {
  const res = await axiosClient.get('/dashboards/admin');
  return res.data;
}

export async function getReceptionistDashboard() {
  const res = await axiosClient.get('/dashboards/receptionist');
  return res.data;
}

export async function getMaintenanceDashboard() {
  const res = await axiosClient.get('/dashboards/maintenance');
  return res.data;
}

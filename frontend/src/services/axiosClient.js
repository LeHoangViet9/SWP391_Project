import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hms_token');
  const locale = localStorage.getItem('hms_locale') || 'vi';
  config.headers['Accept-Language'] = locale === 'vi' ? 'vi-VN' : 'en-US';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.success === false) {
      const err = new Error(data.message || 'Request failed');
      err.status = response.status;
      err.data = data;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Network error';
    const err = new Error(message);
    err.status = error.response?.status;
    err.data = error.response?.data;
    return Promise.reject(err);
  }
);

export function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') searchParams.set(key, value);
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function postFormData(endpoint, formData, method = 'POST') {
  const response = await axiosClient.request({
    url: endpoint,
    method,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export default axiosClient;

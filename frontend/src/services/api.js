const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

// bước 1: Dòng 3-12: Hàm xây dựng header tự động
function buildAuthHeaders(locale, extraHeaders = {}, includeJson = true) {
  const acceptLanguage = locale === 'vi' ? 'vi-VN' : 'en-US'; // chọn ngôn ngữ
  const token = localStorage.getItem('hms_token'); // lấy JWT đã lưu lúc đăng nhập
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}), // gửi JSON
    'Accept-Language': acceptLanguage, // báo server trả lời bằng tiếng gì
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // gắn token vào header
  };
}


// Hàm xử lý lỗi tập trung
// b3api.js - Dòng 14-23: Xử lý response
async function handleResponse(response) {
  const data = await response.json().catch(() => ({})); // đọc body JSON
  if (!response.ok || data.success === false) { // nếu HTTP lỗi hoặc success=false
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status; // lưu status code (403, 404, 409...)
    err.data = data;
    throw err; // ném lỗi để catch ở component bắt
  }
  return data; // trả về data nếu thành công
}


/**
 * Central fetch wrapper — attaches Accept-Language header for Spring Boot i18n.
 */
// b2api.js - Dòng 28-34: Hàm fetch trung tâm
export async function apiFetch(endpoint, options = {}, locale = 'vi') {
  const response = await fetch(`${API_BASE}${endpoint}`, { // gửi HTTP request
    ...options,
    headers: buildAuthHeaders(locale, options.headers, true), // gắn header đã build
  });
  return handleResponse(response); // xử lý kết quả trả về
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


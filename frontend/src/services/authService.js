import { apiFetch } from './api';

const USER_KEY = 'hms_user';
const TOKEN_KEY = 'hms_token';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(user) {
  if (user?.token) localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('hms_customer_id');
}

/** POST /api/v1/auth/login */
export async function login(credentials, locale = 'vi') {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  }, locale);
  if (res?.data) saveAuth(res.data);
  return res;
}

/** POST /api/v1/auth/register */
export async function register(payload, locale = 'vi') {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: payload.fullName,
      userName: payload.userName,
      password: payload.password,
      rePassword: payload.rePassword,
      email: payload.email,
      phone: payload.phone,
    }),
  }, locale);
  return res;
}

/** PUT /api/v1/auth/change-password */
export async function changePassword(payload, locale = 'vi') {
  return apiFetch('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword,
      confirmNewPassword: payload.confirmNewPassword,
    }),
  }, locale);
}

/** POST /api/v1/auth/forgot-password */
export async function forgotPassword(email, locale = 'vi') {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, locale);
}

/** POST /api/v1/auth/reset-password */
export async function resetPassword(payload, locale = 'vi') {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: payload.token,
      newPassword: payload.newPassword,
      confirmPassword: payload.confirmPassword,
    }),
  }, locale);
}

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

/** POST /api/v1/auth/active-account */
export async function activeAccount(payload, locale = 'vi') {
  const res = await apiFetch('/auth/active-account', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      otp: payload.otp,
    }),
  }, locale);
  return res;
}

/** GET /api/v1/auth/me */
export async function getCurrentUser(locale = 'vi') {
  const res = await apiFetch('/auth/me', {}, locale);
  if (res?.data) {
    saveAuth({ ...res.data, token: getStoredToken() });
  }
  return res;
}

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
  localStorage.removeItem('hms_booking_cart');
  localStorage.removeItem('hms_booking_cart_hold_token');
}

/** POST /api/v1/auth/login */
export async function login(credentials, locale = 'vi') {
  const email = credentials.email ? credentials.email.trim() : credentials.email;
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      password: credentials.password,
    }),
  }, locale);
  if (res?.data) saveAuth(res.data);
  return res;
}

/** POST /api/v1/auth/register */
export async function register(payload, locale = 'vi') {
  const email = payload.email ? payload.email.trim() : payload.email;
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: payload.fullName,
      password: payload.password,
      rePassword: payload.rePassword,
      email: email,
      phone: payload.phone,
    }),
  }, locale);
  return res;
}

/** POST /api/v1/auth/verify-otp */
export async function verifyOtp(payload, locale = 'vi') {
  const email = payload.email ? payload.email.trim() : payload.email;
  const res = await apiFetch('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      otpCode: payload.otpCode,
    }),
  }, locale);
  return res;
}

/** POST /api/v1/auth/resend-otp */
export async function resendOtp(email, locale = 'vi') {
  const res = await apiFetch(`/auth/resend-otp?email=${encodeURIComponent(email)}`, {
    method: 'POST',
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

/** PUT /api/v1/auth/change-password */
export async function changePassword(payload, locale = 'vi') {
  const res = await apiFetch('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword,
      confirmNewPassword: payload.confirmNewPassword,
    }),
  }, locale);
  return res;
}

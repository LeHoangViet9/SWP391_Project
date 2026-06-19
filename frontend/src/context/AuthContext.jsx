import { createContext, useContext, useState, useCallback } from 'react';
import {
  getStoredUser,
  getStoredToken,
  clearAuth,
  login as apiLogin,
  register as apiRegister,
  verifyOtp as apiVerifyOtp,
  getCurrentUser as apiGetCurrentUser,
} from '../services/authService';
import { useLocale } from './LocaleContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { locale } = useLocale();
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  const login = useCallback(async (credentials) => {
    const res = await apiLogin(credentials, locale);
    if (res?.data) {
      setUser(res.data);
      setToken(res.data.token ?? null);
    }
    return res;
  }, [locale]);

  const register = useCallback(async (payload) => {
    return apiRegister(payload, locale);
  }, [locale]);

  const verifyOtp = useCallback(async (payload) => {
    const res = await apiVerifyOtp(payload, locale);
    if (res?.data?.token) {
      setUser(res.data);
      setToken(res.data.token);
    }
    return res;
  }, [locale]);

  const refreshCurrentUser = useCallback(async () => {
    const res = await apiGetCurrentUser(locale);
    if (res?.data) {
      const currentToken = getStoredToken();
      setUser({ ...res.data, token: currentToken });
      setToken(currentToken);
    }
    return res;
  }, [locale]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const hasRole = useCallback(
    (...roles) => roles.includes(user?.roleName),
    [user?.roleName]
  );

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, login, register, verifyOtp, logout, hasRole, refreshCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

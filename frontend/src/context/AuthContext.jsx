import { createContext, useContext, useState, useCallback } from 'react';
import {
  getStoredUser,
  getStoredToken,
  clearAuth,
  login as apiLogin,
  register as apiRegister,
} from '../services/authService';
import { useLocale } from './LocaleContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { locale } = useLocale();
  const [user, setUser] = useState(getStoredUser);
  const token = getStoredToken();

  const login = useCallback(async (credentials) => {
    const res = await apiLogin(credentials, locale);
    if (res?.data) setUser(res.data);
    return res;
  }, [locale]);

  const register = useCallback(async (payload) => {
    return apiRegister(payload, locale);
  }, [locale]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token && user);

  const hasRole = useCallback(
    (...roles) => roles.includes(user?.roleName),
    [user?.roleName]
  );

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, login, register, logout, hasRole }}
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

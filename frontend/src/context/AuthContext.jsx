import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  getStoredUser,
  getStoredToken,
  clearAuth,
  login as apiLogin,
  register as apiRegister,
  getCurrentUser as apiGetCurrentUser,
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

  const refreshCurrentUser = useCallback(async () => {
    const res = await apiGetCurrentUser(locale);
    if (res?.data) setUser({ ...res.data, token });
    return res;
  }, [locale, token]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token && user);
  const permissionSet = useMemo(
    () => new Set(user?.permissions ?? []),
    [user?.permissions]
  );

  const hasRole = useCallback(
    (...roles) => roles.includes(user?.roleName),
    [user?.roleName]
  );

  const hasPermission = useCallback(
    (permission) => permissionSet.has(permission),
    [permissionSet]
  );

  const hasAnyPermission = useCallback(
    (permissions = []) => permissions.some((permission) => permissionSet.has(permission)),
    [permissionSet]
  );

  const hasAllPermissions = useCallback(
    (permissions = []) => permissions.every((permission) => permissionSet.has(permission)),
    [permissionSet]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshCurrentUser,
      }}
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

/**
 * usePermission — Custom hook for permission-based UI rendering.
 *
 * Usage:
 *   const { hasPermission, hasAnyPermission } = usePermission();
 *   if (hasPermission('BOOKING_CREATE')) { ... }
 *   if (hasAnyPermission(['BOOKING_VIEW', 'BOOKING_VIEW_OWN'])) { ... }
 */
import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export function usePermission() {
  const { user } = useAuth();

  // Build a Set once for O(1) lookups
  const permSet = useMemo(
    () => new Set(user?.permissions ?? []),
    [user?.permissions]
  );

  /**
   * Check if user has a specific permission.
   * @param {string} perm — e.g. 'BOOKING_CREATE'
   * @returns {boolean}
   */
  const hasPermission = useCallback(
    (perm) => permSet.has(perm),
    [permSet]
  );

  /**
   * Check if user has at least ONE of the given permissions.
   * @param {string[]} perms — e.g. ['BOOKING_VIEW', 'BOOKING_VIEW_OWN']
   * @returns {boolean}
   */
  const hasAnyPermission = useCallback(
    (perms) => perms.some((p) => permSet.has(p)),
    [permSet]
  );

  /**
   * Check if user has ALL of the given permissions.
   * @param {string[]} perms
   * @returns {boolean}
   */
  const hasAllPermissions = useCallback(
    (perms) => perms.every((p) => permSet.has(p)),
    [permSet]
  );

  return { hasPermission, hasAnyPermission, hasAllPermissions, permissions: permSet };
}

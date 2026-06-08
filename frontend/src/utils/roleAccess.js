import { STAFF_ROLES } from '../constants/enums';

export function isStaffRole(roleName) {
  return STAFF_ROLES.includes(roleName);
}

export function getDefaultDashboardPath(roleName) {
  switch (roleName) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'RECEPTIONIST':
      return '/receptionist/dashboard';
    case 'HOUSEKEEPER':
      return '/housekeeper/dashboard';
    case 'MAINTENANCE':
      return '/maintenance/dashboard';
    default:
      return '/';
  }
}

export function canAccessDashboard(roleName, path) {
  const rules = {
    '/admin/dashboard': ['ADMIN'],
    '/receptionist/dashboard': ['RECEPTIONIST', 'ADMIN'],
    '/housekeeper/dashboard': ['HOUSEKEEPER', 'ADMIN'],
    '/maintenance/dashboard': ['MAINTENANCE', 'ADMIN'],
  };
  const allowed = rules[path];
  if (!allowed) return true;
  return allowed.includes(roleName);
}

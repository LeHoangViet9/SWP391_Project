export function isStaffRole(role) {
  const staffRoles = ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE'];
  return staffRoles.includes(role);
}

export function getDefaultDashboardPath(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'MANAGER':
      return '/manager/dashboard';
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

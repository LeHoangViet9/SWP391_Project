export function isStaffRole(role) {
  const staffRoles = ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE'];
  return staffRoles.includes(role);
}

export function getDefaultDashboardPath(role) {
  if (role) {
    return '/dashboard';
  }
  return '/';
}

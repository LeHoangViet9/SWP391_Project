const STAFF_ROLES = ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE'];

const ROLE_DASHBOARD_PATH = {
  ADMIN: '/staff/dashboard',
  MANAGER: '/staff/dashboard',
  RECEPTIONIST: '/staff/dashboard',
  HOUSEKEEPER: '/staff/dashboard',
  MAINTENANCE: '/staff/dashboard',
  CUSTOMER: '/',
};

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function getDefaultDashboardPath(role) {
  return ROLE_DASHBOARD_PATH[role] || '/';
}

export function canManageUsers(role) {
  return role === 'ADMIN';
}

export function canDeleteCustomer(role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canDeleteEquipment(role) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canEditEquipment(role) {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'MAINTENANCE';
}

export function canManageCustomers(role) {
  return ['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(role);
}

export function canManageBookings(role) {
  return ['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(role);
}

export function canViewBookings(role) {
  return ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER'].includes(role);
}

export function canViewEquipment(role) {
  return STAFF_ROLES.includes(role);
}

export function getNavItems(role, t) {
  const items = [];

  if (isStaffRole(role)) {
    items.push({ path: '/staff/dashboard', label: t('staff.nav.dashboard'), icon: 'LayoutDashboard' });
  }

  if (canManageBookings(role)) {
    items.push({ path: '/staff/bookings/today', label: t('staff.nav.bookingToday'), icon: 'CalendarCheck' });
    items.push({ path: '/staff/bookings', label: t('staff.nav.bookings'), icon: 'BookOpen' });
  } else if (canViewBookings(role)) {
    items.push({ path: '/staff/bookings/today', label: t('staff.nav.bookingToday'), icon: 'CalendarCheck' });
  }

  if (canManageCustomers(role)) {
    items.push({ path: '/staff/customers', label: t('staff.nav.customers'), icon: 'Users' });
  }

  if (canViewEquipment(role)) {
    items.push({ path: '/staff/equipments', label: t('staff.nav.equipments'), icon: 'Wrench' });
  }

  if (canManageUsers(role)) {
    items.push({ path: '/staff/users', label: t('staff.nav.users'), icon: 'UserCog' });
  }

  items.push({ path: '/staff/profile', label: t('staff.nav.profile'), icon: 'UserCircle' });

  return items;
}

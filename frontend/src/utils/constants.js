export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
};

export const EQUIPMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  BROKEN: 'BROKEN',
};

export const CUSTOMER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

export const ID_TYPES = ['CCCD', 'PASSPORT', 'OTHER'];

export const STAFF_ROLES_FOR_REGISTER = [
  'RECEPTIONIST',
  'HOUSEKEEPER',
  'MAINTENANCE',
  'MANAGER',
];

export const USER_ROLES = [
  'ADMIN',
  'MANAGER',
  'RECEPTIONIST',
  'HOUSEKEEPER',
  'MAINTENANCE',
  'CUSTOMER',
];

export const PAGE_SIZE = 10;

/** Map booking status to human-readable Vietnamese labels */
export const BOOKING_STATUS_LABELS = {
  vi: {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đã nhận phòng',
    CHECKED_OUT: 'Đã trả phòng',
    CANCELLED: 'Đã hủy',
    NO_SHOW: 'Không đến',
  },
  en: {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CHECKED_IN: 'Checked In',
    CHECKED_OUT: 'Checked Out',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  },
};

export const EQUIPMENT_STATUS_LABELS = {
  vi: {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Không hoạt động',
    MAINTENANCE: 'Bảo trì',
    BROKEN: 'Hỏng',
  },
  en: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    MAINTENANCE: 'Maintenance',
    BROKEN: 'Broken',
  },
};

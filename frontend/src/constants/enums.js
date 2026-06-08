export const BOOKING_STATUS = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
];

export const ROOM_STATUS = [
  'AVAILABLE',
  'OCCUPIED',
  'DIRTY',
  'MAINTENANCE',
  'INACTIVE',
];

export const ACCOUNT_STATUS = ['ACTIVE', 'INACTIVE', 'BANNED'];

export const ID_TYPE = ['CCCD', 'PASSPORT', 'OTHER'];

export const MAINTENANCE_SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const MAINTENANCE_STATUS = [
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export const EQUIPMENT_STATUS = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'BROKEN'];

export const SORT_FIELDS = [
  { value: 'ID', label: 'ID' },
  { value: 'TYPE_NAME', label: 'Tên loại' },
  { value: 'BASE_PRICE', label: 'Giá cơ bản' },
];

export const SORT_DIRECTIONS = [
  { value: 'ASC', label: 'Tăng dần' },
  { value: 'DESC', label: 'Giảm dần' },
];

export const STAFF_ROLES = ['ADMIN', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE'];

/** Bộ lọc vệ sinh buồng phòng (map với RoomStatus backend) */
export const HOUSEKEEPING_FILTERS = [
  { value: 'DIRTY', label: 'Cần dọn (DIRTY)' },
  { value: 'CLEANING', label: 'Đang dọn (CLEANING)' },
  { value: 'CLEAN', label: 'Đã sạch (CLEAN)' },
];

export const ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  RECEPTIONIST: 'Lễ tân',
  HOUSEKEEPER: 'Buồng phòng',
  MAINTENANCE: 'Bảo trì',
  CUSTOMER: 'Khách hàng',
};

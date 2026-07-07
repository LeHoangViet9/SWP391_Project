/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         HMS LUXURY — CENTRALIZED MENU PERMISSION CONFIG         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * CÁCH HOẠT ĐỘNG:
 * - Mỗi menu item có `permissions: string[]` — danh sách quyền CRUD.
 * - Sidebar hiện item nếu user có BẤT KỲ quyền nào trong danh sách.
 * - Nút hành động (Add/Edit/Delete) kiểm tra quyền cụ thể qua usePermission().
 * - Items có `alwaysVisible: true` luôn hiện (Account, Password).
 *
 * PERMISSION MATRIX:
 * ┌────────────────────┬──────┬─────────┬─────────────┬─────────────┬────────────┬──────────┐
 * │ Menu Item          │ADMIN │MANAGER  │RECEPTIONIST │MAINTENANCE  │HOUSEKEEPER │CUSTOMER  │
 * ├────────────────────┼──────┼─────────┼─────────────┼─────────────┼────────────┼──────────┤
 * │ Báo Cáo            │  ✓   │    ✓    │             │             │            │          │
 * │ Phân Quyền         │  ✓   │         │             │             │            │          │
 * │ Nhân Viên          │  ✓   │    ✓    │             │             │            │          │
 * │ Loại Phòng         │  ✓   │    ✓    │             │             │            │          │
 * │ Phòng              │  ✓   │    ✓    │      ✓      │             │            │          │
 * │ Đặt Phòng          │  ✓   │    ✓    │      ✓      │             │            │          │
 * │ Đặt Phòng Của Tôi  │      │         │             │             │            │    ✓     │
 * │ Khách Hàng         │  ✓   │    ✓    │      ✓      │             │            │          │
 * │ Thiết Bị           │  ✓   │    ✓    │             │      ✓      │            │          │
 * │ Phân Bổ Thiết Bị   │  ✓   │    ✓    │             │      ✓      │            │          │
 * │ Bảo Trì            │  ✓   │    ✓    │             │      ✓      │     ✓      │          │
 * │ Buồng Phòng        │  ✓   │    ✓    │             │             │     ✓      │          │
 * │ Đánh Giá           │  ✓   │    ✓    │      ✓      │             │            │    ✓     │
 * │ Hóa Đơn            │  ✓   │    ✓    │      ✓      │             │            │    ✓     │
 * │ Tài Khoản          │  ✓   │    ✓    │      ✓      │      ✓      │     ✓      │    ✓     │
 * │ Đổi Mật Khẩu       │  ✓   │    ✓    │      ✓      │      ✓      │     ✓      │    ✓     │
 * └────────────────────┴──────┴─────────┴─────────────┴─────────────┴────────────┴──────────┘
 */

import {
  BarChart2,
  ShieldCheck,
  UserCheck,
  BedDouble,
  Tag,
  CalendarCheck,
  ClipboardCheck,
  LogOut,
  CalendarDays,
  Users,
  Wrench,
  PackageCheck,
  Hammer,
  ClipboardList,
  MessageSquare,
  FileText,
  UserCircle,
  KeyRound,
} from 'lucide-react';

/**
 * @typedef {Object} MenuItem
 * @property {string}    key            - Unique key for the menu item
 * @property {string}    label          - Display label (Vietnamese)
 * @property {string}    labelEn        - Display label (English)
 * @property {string}    path           - React Router navigation path
 * @property {Function}  icon           - Lucide React icon component
 * @property {string[]}  permissions    - Required permissions (user needs ANY of these to see this item)
 * @property {string}    group          - Section grouping key
 * @property {boolean}   [alwaysVisible] - If true, always shown regardless of permissions
 */

/** @type {MenuItem[]} */
export const MENU_CONFIG = [
  // ── Nhóm: Tổng Quan ──────────────────────────────────────────────
  {
    key: 'dashboard',
    label: 'Báo Cáo',
    labelEn: 'Dashboard',
    path: '/dashboard/reports',
    icon: BarChart2,
    permissions: ['DASHBOARD_VIEW'],
    group: 'overview',
  },

  // ── Nhóm: Quản Trị Hệ Thống ──────────────────────────────────────
  {
    key: 'role-config',
    label: 'Phân Quyền',
    labelEn: 'Role Config',
    path: '/dashboard/roles',
    icon: ShieldCheck,
    permissions: ['USER_AUTHORIZE'],
    group: 'system',
  },
  {
    key: 'staff',
    label: 'Nhân Viên',
    labelEn: 'Staff',
    path: '/dashboard/staff',
    icon: UserCheck,
    permissions: ['USER_VIEW'],
    group: 'system',
  },

  // ── Nhóm: Phòng Ốc ───────────────────────────────────────────────
  {
    key: 'room-types',
    label: 'Loại Phòng',
    labelEn: 'Room Types',
    path: '/dashboard/room-types',
    icon: Tag,
    permissions: ['ROOM_TYPE_VIEW'],
    group: 'rooms',
  },
  {
    key: 'rooms',
    label: 'Phòng',
    labelEn: 'Rooms',
    path: '/dashboard/rooms',
    icon: BedDouble,
    permissions: ['ROOM_VIEW'],
    group: 'rooms',
  },

  // ── Nhóm: Hoạt Động ──────────────────────────────────────────────
  {
    key: 'bookings',
    label: 'Đặt Phòng',
    labelEn: 'Bookings',
    path: '/dashboard/bookings',
    icon: CalendarCheck,
    permissions: ['BOOKING_VIEW'],
    group: 'operations',
  },
  {
    key: 'check-in',
    label: 'Check-in / Check-out',
    labelEn: 'Check-in / Check-out',
    path: '/dashboard/check-in',
    icon: ClipboardCheck,
    permissions: ['CHECKIN_VIEW', 'CHECKIN_PROCESS', 'CHECKOUT_VIEW', 'CHECKOUT_PROCESS'],
    group: 'operations',
  },
  {
    key: 'my-bookings',
    label: 'Đặt Phòng Của Tôi',
    labelEn: 'My Bookings',
    path: '/dashboard/my-bookings',
    icon: CalendarDays,
    permissions: ['BOOKING_VIEW_OWN'],
    group: 'operations',
  },
  {
    key: 'customers',
    label: 'Khách Hàng',
    labelEn: 'Customers',
    path: '/dashboard/customers',
    icon: Users,
    permissions: ['CUSTOMER_VIEW'],
    group: 'operations',
  },
  {
    key: 'equipment',
    label: 'Thiết Bị',
    labelEn: 'Equipment',
    path: '/dashboard/equipment',
    icon: Wrench,
    permissions: ['EQUIPMENT_VIEW'],
    group: 'operations',
  },
  {
    key: 'assign-equipment',
    label: 'Phân Bổ Thiết Bị',
    labelEn: 'Assign Equipment',
    path: '/dashboard/assign-equipment',
    icon: PackageCheck,
    permissions: ['EQUIPMENT_UPDATE'],
    group: 'operations',
  },
  {
    key: 'maintenance',
    label: 'Bảo Trì',
    labelEn: 'Maintenance',
    path: '/dashboard/maintenance',
    icon: Hammer,
    permissions: ['MAINTENANCE_VIEW'],
    group: 'operations',
  },
  {
    key: 'housekeeping',
    label: 'Buồng Phòng',
    labelEn: 'Housekeeping',
    path: '/dashboard/housekeeping',
    icon: ClipboardList,
    permissions: ['HOUSEKEEPING_VIEW'],
    group: 'operations',
  },
  {
    key: 'feedback',
    label: 'Đánh Giá',
    labelEn: 'Feedback',
    path: '/dashboard/feedback',
    icon: MessageSquare,
    permissions: ['FEEDBACK_VIEW'],
    group: 'operations',
  },
  {
    key: 'invoices',
    label: 'Hóa Đơn',
    labelEn: 'Invoices',
    path: '/dashboard/invoices',
    icon: FileText,
    permissions: ['INVOICE_VIEW'],
    group: 'operations',
  },

  // ── Nhóm: Tài Khoản (luôn hiện) ──────────────────────────────────
  {
    key: 'account',
    label: 'Thông Tin Tài Khoản',
    labelEn: 'Account Info',
    path: '/dashboard/account',
    icon: UserCircle,
    permissions: [],
    group: 'account',
    alwaysVisible: true,
  },
  {
    key: 'password',
    label: 'Đổi Mật Khẩu',
    labelEn: 'Change Password',
    path: '/dashboard/password',
    icon: KeyRound,
    permissions: [],
    group: 'account',
    alwaysVisible: true,
  },
];

/**
 * Group labels for sidebar section headers
 */
export const GROUP_LABELS = {
  overview:   { vi: 'Tổng Quan',    en: 'Overview' },
  system:     { vi: 'Quản Trị',     en: 'Administration' },
  rooms:      { vi: 'Phòng Ốc',     en: 'Rooms' },
  operations: { vi: 'Hoạt Động',    en: 'Operations' },
  account:    { vi: 'Tài Khoản',    en: 'Account' },
};

/**
 * Filter menu items based on user permissions array.
 * An item is visible if:
 * - `alwaysVisible === true`, OR
 * - user has at least ONE permission in the item's `permissions` array.
 *
 * @param {string[]} userPermissions - Array of permission codes from user object
 * @returns {MenuItem[]} Filtered list of menu items the user can see
 */
export function filterMenuByPermissions(userPermissions = []) {
  const permSet = new Set(userPermissions);
  return MENU_CONFIG.filter((item) => {
    return canAccessMenuItem(item, permSet);
  });
}

export function canAccessMenuItem(item, userPermissions = []) {
  const permSet = userPermissions instanceof Set
    ? userPermissions
    : new Set(userPermissions);

  if (item.alwaysVisible) return true;
  if (!item.permissions || item.permissions.length === 0) return true;
  return item.permissions.some((p) => permSet.has(p));
}

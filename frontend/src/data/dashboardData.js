import {
  DollarSign,
  TrendingUp,
  BarChart2,
  CalendarCheck,
  Users,
  Tag,
  BedDouble,
  UserCheck,
  LogIn,
  LogOut,
  CheckCircle2,
  Hammer,
  AlertCircle,
  Wrench,
  ClipboardList,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

/**
 * Static configuration of statistic cards for all 4 Dashboards.
 * Separated by role for easy mapping and rendering.
 */

// 1. ADMIN & MANAGER DASHBOARD CARDS
export const adminDashboardCards = [
  {
    key: 'totalRevenue',
    titleKey: 'report.kpi.totalRevenue',
    icon: DollarSign,
    linkPath: '/dashboard/invoices',
    color: '#bfa15f',
    getValue: (data, formatVND, locale) => `${formatVND(data?.totalRevenueAllTime, locale)} ₫`,
    subKey: 'report.kpi.allTime'
  },
  {
    key: 'revenueToday',
    titleKey: 'report.kpi.revenueToday',
    icon: TrendingUp,
    linkPath: '/dashboard/invoices',
    color: '#22c55e',
    getValue: (data, formatVND, locale) => `${formatVND(data?.todayRevenue, locale)} ₫`,
    getSub: (data, locale) => 
      locale === 'vi' 
        ? new Date().toLocaleDateString('vi-VN') 
        : new Date().toLocaleDateString('en-US')
  },
  {
    key: 'revenueThisMonth',
    titleKey: 'report.kpi.revenueThisMonth',
    icon: BarChart2,
    linkPath: '/dashboard/invoices',
    color: '#4f8ef7',
    getValue: (data, formatVND, locale) => `${formatVND(data?.thisMonthRevenue, locale)} ₫`,
    getSub: (data, locale) => {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      return locale === 'vi' ? `Tháng ${month}/${year}` : `Month ${month}/${year}`;
    }
  },
  {
    key: 'successfulBookings',
    titleKey: 'report.kpi.successfulBookings',
    icon: CalendarCheck,
    linkPath: '/dashboard/bookings',
    color: '#8b5cf6',
    getValue: (data) => data?.totalSuccessfulBookings ?? '—',
    subKey: 'report.kpi.bookingsCount'
  },
  {
    key: 'customers',
    titleKey: 'report.kpi.customers',
    icon: Users,
    linkPath: '/dashboard/customers',
    color: '#06b6d4',
    getValue: (data) => data?.totalCustomers ?? '—',
    subKey: 'report.kpi.totalCustomers'
  },
  {
    key: 'roomTypes',
    titleKey: 'report.kpi.roomTypes',
    icon: Tag,
    linkPath: '/dashboard/room-types',
    color: '#f59e0b',
    getValue: (data) => data?.totalRoomTypes ?? '—',
    subKey: 'report.kpi.totalRoomTypes'
  },
  {
    key: 'rooms',
    titleKey: 'report.kpi.rooms',
    icon: BedDouble,
    linkPath: '/dashboard/rooms',
    color: '#10b981',
    getValue: (data) => data?.totalRooms ?? '—',
    subKey: 'report.kpi.totalRooms'
  },
  {
    key: 'staff',
    titleKey: 'report.kpi.staff',
    icon: UserCheck,
    linkPath: '/dashboard/staff',
    color: '#f43f5e',
    getValue: (data) => data?.totalStaff ?? '—',
    subKey: 'report.kpi.totalStaff'
  }
];

// 2. RECEPTIONIST DASHBOARD CARDS
export const receptionDashboardCards = [
  {
    key: 'expectedCheckIns',
    title: 'Dự kiến nhận phòng',
    icon: LogIn,
    linkPath: '/dashboard/check-in',
    color: '#3b82f6',
    getValue: (data) => data?.expectedCheckIns ?? 0
  },
  {
    key: 'expectedCheckOuts',
    title: 'Dự kiến trả phòng',
    icon: LogOut,
    linkPath: '/dashboard/check-in',
    color: '#8b5cf6',
    getValue: (data) => data?.expectedCheckOuts ?? 0
  },
  {
    key: 'actualCheckIns',
    title: 'Đã nhận phòng',
    icon: CheckCircle2,
    linkPath: '/dashboard/check-in',
    color: '#10b981',
    getValue: (data) => data?.actualCheckIns ?? 0
  },
  {
    key: 'actualCheckOuts',
    title: 'Đã trả phòng',
    icon: CheckCircle2,
    linkPath: '/dashboard/check-in',
    color: '#14b8a6',
    getValue: (data) => data?.actualCheckOuts ?? 0
  },
  {
    key: 'pendingBookings',
    title: 'Chờ duyệt đặt phòng',
    icon: CalendarCheck,
    linkPath: '/dashboard/bookings',
    color: '#f59e0b',
    getValue: (data) => data?.pendingBookings ?? 0
  }
];

// 3. MAINTENANCE DASHBOARD CARDS
export const maintenanceDashboardCards = [
  {
    key: 'totalRequests',
    title: 'Tổng yêu cầu',
    icon: Hammer,
    linkPath: '/dashboard/maintenance',
    color: '#64748b',
    getValue: (data) => data?.totalRequests ?? 0
  },
  {
    key: 'pendingRequests',
    title: 'Chưa xử lý',
    icon: AlertCircle,
    linkPath: '/dashboard/maintenance',
    color: '#ef4444',
    getValue: (data) => data?.pendingRequests ?? 0
  },
  {
    key: 'inProgressRequests',
    title: 'Đang sửa chữa',
    icon: Wrench,
    linkPath: '/dashboard/maintenance',
    color: '#3b82f6',
    getValue: (data) => data?.inProgressRequests ?? 0
  },
  {
    key: 'completedRequests',
    title: 'Đã hoàn thành',
    icon: CheckCircle2,
    linkPath: '/dashboard/maintenance',
    color: '#10b981',
    getValue: (data) => data?.completedRequests ?? 0
  },
  {
    key: 'totalCost',
    title: 'Tổng chi phí',
    icon: DollarSign,
    linkPath: '/dashboard/maintenance',
    color: '#bfa15f',
    getValue: (data, formatVND, locale) => `${formatVND(data?.totalCost, locale)} ₫`
  }
];

// 4. HOUSEKEEPING DASHBOARD CARDS
export const housekeepingDashboardCards = [
  {
    key: 'myAssignedTasksCount',
    title: 'Nhiệm vụ của tôi hôm nay',
    icon: ClipboardList,
    linkPath: '/dashboard/housekeeping',
    color: '#bfa15f',
    getValue: (data) => data?.myAssignedTasksCount ?? 0
  },
  {
    key: 'dirtyRoomsCount',
    title: 'Phòng đang bẩn (DIRTY)',
    icon: AlertTriangle,
    linkPath: '/dashboard/housekeeping',
    color: '#ef4444',
    getValue: (data) => data?.dirtyRoomsCount ?? 0
  },
  {
    key: 'cleaningRoomsCount',
    title: 'Phòng đang dọn (CLEANING)',
    icon: Sparkles,
    linkPath: '/dashboard/housekeeping',
    color: '#3b82f6',
    getValue: (data) => data?.cleaningRoomsCount ?? 0
  },
  {
    key: 'availableRoomsCount',
    title: 'Phòng trống sẵn sàng (AVAILABLE)',
    icon: CheckCircle2,
    linkPath: '/dashboard/housekeeping', // Redirects to housekeeping board since housekeeper lacks ROOM_VIEW permission
    color: '#10b981',
    getValue: (data) => data?.availableRoomsCount ?? 0
  }
];

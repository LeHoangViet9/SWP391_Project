/**
 * DashboardRouter — Unified dashboard for ALL roles.
 *
 * Maps URL paths to content components and wraps them in PermissionLayout.
 * The PermissionSidebar handles navigation visibility based on user permissions.
 * If a user navigates to a page they don't have permission for,
 * they're redirected to their first allowed page.
 */
import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PermissionLayout from '../components/shared/PermissionLayout';
import { filterMenuByPermissions } from '../config/menuConfig';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

// ── Lazy-loaded content components ──────────────────────────────────────────
import ReportManager from '../components/ReportManager';
import StaffManager from '../components/StaffManager';
import RoomTypeManager from '../components/RoomTypeManager';
import RoomManager from '../components/RoomManager';
import BookingManager from '../components/BookingManager';
import CheckInManager from '../components/CheckInManager';
import CustomerManager from '../components/CustomerManager';
import EquipmentManager from '../components/EquipmentManager';
import AssignEquipmentToRoom from '../components/AssignEquipmentToRoom';
import MaintenanceManager from '../components/MaintenanceManager';
import HousekeepingBoard from '../components/HousekeepingBoard';
import CustomerBookingHistory from '../components/CustomerBookingHistory';
import AccountInfo from '../components/AccountInfo';
import ChangePassword from '../components/ChangePassword';
import RolePermissionManager from '../components/RolePermissionManager';
import FeedbackManager from '../components/FeedbackManager';
import InvoiceManager from '../components/InvoiceManager';
import AuditLogManager from '../components/AuditLogManager';

/**
 * Route-to-component mapping.
 * Keys match the `path` suffix in menuConfig.js (e.g., '/dashboard/reports' → 'reports').
 */
const ROUTE_COMPONENTS = {
  'audit-logs':       { Component: AuditLogManager,        title: 'Audit Log',              titleEn: 'Audit Log' },
  'reports':          { Component: ReportManager,          title: 'Báo Cáo',              titleEn: 'Dashboard Reports' },
  'roles':            { Component: RolePermissionManager,  title: 'Phân Quyền',            titleEn: 'Role Configuration' },
  'staff':            { Component: StaffManager,           title: 'Quản Lý Nhân Viên',     titleEn: 'Staff Management' },
  'room-types':       { Component: RoomTypeManager,        title: 'Quản Lý Loại Phòng',    titleEn: 'Room Type Management' },
  'rooms':            { Component: RoomManager,            title: 'Quản Lý Phòng',         titleEn: 'Room Management' },
  'bookings':         { Component: BookingManager,         title: 'Quản Lý Đặt Phòng',     titleEn: 'Booking Management' },
  'check-in':         { Component: CheckInManager,         title: 'Check-in',               titleEn: 'Check-in' },
  'my-bookings':      { Component: CustomerBookingHistory, title: 'Đặt Phòng Của Tôi',     titleEn: 'My Bookings' },
  'customers':        { Component: CustomerManager,        title: 'Quản Lý Khách Hàng',    titleEn: 'Customer Management' },
  'equipment':        { Component: EquipmentManager,       title: 'Quản Lý Thiết Bị',      titleEn: 'Equipment Management' },
  'assign-equipment': { Component: AssignEquipmentToRoom,  title: 'Phân Bổ Thiết Bị',      titleEn: 'Assign Equipment' },
  'maintenance':      { Component: MaintenanceManager,     title: 'Quản Lý Bảo Trì',       titleEn: 'Maintenance Management' },
  'housekeeping':     { Component: HousekeepingBoard,      title: 'Quản Lý Buồng Phòng',   titleEn: 'Housekeeping' },
  'feedback':         { Component: FeedbackManager,        title: 'Đánh Giá',              titleEn: 'Feedback' },
  'invoices':         { Component: InvoiceManager,         title: 'Hóa Đơn',               titleEn: 'Invoices' },
  'account':          { Component: AccountInfo,            title: 'Thông Tin Tài Khoản',   titleEn: 'Account Info' },
  'password':         { Component: ChangePassword,         title: 'Đổi Mật Khẩu',          titleEn: 'Change Password' },
};

/**
 * ContentPage — Renders a single dashboard content area with title.
 */
function ContentPage({ routeKey }) {
  const { locale } = useLocale();
  const route = ROUTE_COMPONENTS[routeKey];
  if (!route) return <Navigate to="/dashboard" replace />;

  const { Component } = route;
  const title = locale === 'vi' ? route.title : route.titleEn;

  return (
    <PermissionLayout title={title}>
      <Component />
    </PermissionLayout>
  );
}

/**
 * DashboardRouter — Main export.
 */
export default function DashboardRouter() {
  const { user } = useAuth();

  const visibleMenu = useMemo(
    () => filterMenuByPermissions(user?.permissions ?? []),
    [user?.permissions]
  );

  const allowedRouteKeys = useMemo(() => {
    return new Set(visibleMenu.map((item) => item.path.replace('/dashboard/', '')));
  }, [visibleMenu]);

  const firstAllowedPath = useMemo(() => {
    const first = visibleMenu.find((item) => item.group !== 'account') || visibleMenu[0];
    return first ? first.path.replace('/dashboard/', '') : 'account';
  }, [visibleMenu]);

  const renderRoute = (key) => {
    if (!allowedRouteKeys.has(key)) {
      return <Navigate to={firstAllowedPath} replace />;
    }

    return <ContentPage routeKey={key} />;
  };

  return (
    <Routes>
      {/* Index — redirect to first allowed page */}
      <Route index element={<Navigate to={firstAllowedPath} replace />} />

      {/* Dynamic content routes */}
      {Object.keys(ROUTE_COMPONENTS).map((key) => (
        <Route
          key={key}
          path={key}
          element={renderRoute(key)}
        />
      ))}

      {/* Catch-all — redirect to first allowed page */}
      <Route path="*" element={<Navigate to={firstAllowedPath} replace />} />
    </Routes>
  );
}

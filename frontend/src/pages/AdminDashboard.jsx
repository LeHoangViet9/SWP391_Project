import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import RoomTypeManager from '../components/RoomTypeManager';
import RoomManager from '../components/RoomManager';
import CustomerManager from '../components/CustomerManager';
import BookingManager from '../components/BookingManager';
import EquipmentManager from '../components/EquipmentManager';
import AssignEquipmentToRoom from '../components/AssignEquipmentToRoom';
import MaintenanceManager from '../components/MaintenanceManager';
import StaffManager from '../components/StaffManager';
import ChangePassword from '../components/ChangePassword';
import ReportManager from '../components/ReportManager';
import AccountInfo from '../components/AccountInfo';
import { Tag, BedDouble, Users, CalendarCheck, Wrench, Hammer, UserCheck, KeyRound, BarChart2, UserCircle, PackageCheck } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

const TABS = [
  { key: 'reports',     label: 'Báo Cáo',       Icon: BarChart2,     component: <ReportManager /> },
  { key: 'room-types',  label: 'Loại Phòng',   Icon: Tag,           component: <RoomTypeManager /> },
  { key: 'rooms',       label: 'Phòng',          Icon: BedDouble,     component: <RoomManager /> },
  { key: 'customers',   label: 'Khách Hàng',    Icon: Users,         component: <CustomerManager /> },
  { key: 'bookings',    label: 'Đặt Phòng',     Icon: CalendarCheck, component: <BookingManager /> },

  // GIỮ:
  // Màn này chỉ quản lý danh mục thiết bị: tên, mã, mô tả, ảnh.
  { key: 'equipments',  label: 'Thiết Bị',      Icon: Wrench,        component: <EquipmentManager /> },

  //  MỚI:
  // Màn riêng để gán thiết bị vào phòng.
  // Đúng theo góp ý của thầy:
  // "Chỉ tạo mới danh sách, thêm màn hình để gán thiết bị vào phòng"
  { key: 'assign-equipments', label: 'Phân Bổ Thiết Bị', Icon: PackageCheck, component: <AssignEquipmentToRoom /> },

  { key: 'maintenance', label: 'Bảo Trì',       Icon: Hammer,        component: <MaintenanceManager /> },
  { key: 'staffs',      label: 'Nhân Viên',     Icon: UserCheck,     component: <StaffManager /> },
  { key: 'account',     label: 'Thông Tin Tài Khoản', Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password',    label: 'Đổi Mật Khẩu',   Icon: KeyRound,      component: <ChangePassword /> },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('reports');
  const { t } = useLocale();

  return (
      <DashboardLayout
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          tabs={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
      />
  );
}
import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import RoomTypeManager from '../components/RoomTypeManager';
import RoomManager from '../components/RoomManager';
import CustomerManager from '../components/CustomerManager';
import BookingManager from '../components/BookingManager';
import EquipmentManager from '../components/EquipmentManager';
import MaintenanceManager from '../components/MaintenanceManager';
import StaffManager from '../components/StaffManager';
import ChangePassword from '../components/ChangePassword';
import { Tag, BedDouble, Users, CalendarCheck, Wrench, Hammer, UserCheck, KeyRound } from 'lucide-react';

const TABS = [
  { key: 'room-types',  label: 'Loại Phòng',   Icon: Tag,           component: <RoomTypeManager /> },
  { key: 'rooms',       label: 'Phòng',          Icon: BedDouble,     component: <RoomManager /> },
  { key: 'customers',   label: 'Khách Hàng',    Icon: Users,         component: <CustomerManager /> },
  { key: 'bookings',    label: 'Đặt Phòng',     Icon: CalendarCheck, component: <BookingManager /> },
  { key: 'equipments',  label: 'Thiết Bị',      Icon: Wrench,        component: <EquipmentManager /> },
  { key: 'maintenance', label: 'Bảo Trì',       Icon: Hammer,        component: <MaintenanceManager /> },
  { key: 'staffs',      label: 'Nhân Viên',     Icon: UserCheck,     component: <StaffManager /> },
  { key: 'password',    label: 'Đổi Mật Khẩu',   Icon: KeyRound,      component: <ChangePassword /> },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('room-types');

  return (
    <DashboardLayout
      title="Bảng Điều Khiển Admin / Manager"
      subtitle="Quản trị toàn bộ hệ thống Hotel Management System"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

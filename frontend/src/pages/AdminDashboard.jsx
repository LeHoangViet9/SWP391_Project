import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import RoomTypeManager from '../components/RoomTypeManager';
import RoomManager from '../components/RoomManager';
import CustomerManager from '../components/CustomerManager';
import BookingManager from '../components/BookingManager';
import EquipmentManager from '../components/EquipmentManager';
import MaintenanceManager from '../components/MaintenanceManager';
import StaffManager from '../components/StaffManager';
//import HousekeepingManager from '../components/HousekeepingManager';
import ChangePassword from '../components/ChangePassword';
import ReportManager from '../components/ReportManager';
import AccountInfo from '../components/AccountInfo';
import { Tag, BedDouble, Users, CalendarCheck, Wrench, Hammer, UserCheck, KeyRound, BarChart2, UserCircle, ClipboardList } from 'lucide-react';

const TABS = [
  { key: 'reports',      label: 'Báo Cáo',          Icon: BarChart2,     component: <ReportManager /> },
  { key: 'room-types',   label: 'Loại Phòng',        Icon: Tag,           component: <RoomTypeManager /> },
  { key: 'rooms',        label: 'Phòng',              Icon: BedDouble,     component: <RoomManager /> },
//  { key: 'housekeeping', label: 'Buồng Phòng',        Icon: ClipboardList, component: <HousekeepingManager /> },
  { key: 'customers',    label: 'Khách Hàng',         Icon: Users,         component: <CustomerManager /> },
  { key: 'bookings',     label: 'Đặt Phòng',          Icon: CalendarCheck, component: <BookingManager /> },
  { key: 'equipments',   label: 'Thiết Bị',           Icon: Wrench,        component: <EquipmentManager /> },
  { key: 'maintenance',  label: 'Bảo Trì',            Icon: Hammer,        component: <MaintenanceManager /> },
  { key: 'staffs',       label: 'Nhân Viên',          Icon: UserCheck,     component: <StaffManager /> },
  { key: 'account',      label: 'Thông Tin Tài Khoản', Icon: UserCircle,   component: <AccountInfo /> },
  { key: 'password',     label: 'Đổi Mật Khẩu',       Icon: KeyRound,     component: <ChangePassword /> },
];

import { useLocale } from '../context/LocaleContext';

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

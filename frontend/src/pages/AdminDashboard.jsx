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
import { Tag, BedDouble, Users, CalendarCheck, Wrench, Hammer, UserCheck, KeyRound, BarChart2, UserCircle, PackageCheck } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

const TABS = [
  { key: 'reports', label: 'Reports', Icon: BarChart2, component: <ReportManager /> },
  { key: 'room-types', label: 'Room Types', Icon: Tag, component: <RoomTypeManager /> },
  { key: 'rooms', label: 'Phòng', Icon: BedDouble, component: <RoomManager /> },
  //  { key: 'housekeeping', label: 'Housekeeping',        Icon: ClipboardList, component: <HousekeepingManager /> },
  { key: 'customers', label: 'Customers', Icon: Users, component: <CustomerManager /> },
  { key: 'bookings', label: 'Bookings', Icon: CalendarCheck, component: <BookingManager /> },
  { key: 'equipments', label: 'Equipment', Icon: Wrench, component: <EquipmentManager /> },
  { key: 'maintenance', label: 'Maintenance', Icon: Hammer, component: <MaintenanceManager /> },
  { key: 'staffs', label: 'Staff', Icon: UserCheck, component: <StaffManager /> },
  { key: 'account', label: 'Account Info', Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password', label: 'Change Password', Icon: KeyRound, component: <ChangePassword /> },
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
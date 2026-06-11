import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import MaintenanceManager from '../components/MaintenanceManager';
import EquipmentManager from '../components/EquipmentManager';
import ChangePassword from '../components/ChangePassword';
import AccountInfo from '../components/AccountInfo';
import { Hammer, Wrench, KeyRound, UserCircle } from 'lucide-react';

const TABS = [
  { key: 'maintenance', label: 'Yêu Cầu Bảo Trì', Icon: Hammer,  component: <MaintenanceManager /> },
  { key: 'equipments',  label: 'Thiết Bị',          Icon: Wrench,  component: <EquipmentManager /> },
  { key: 'account',     label: 'Thông Tin Tài Khoản', Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password',    label: 'Đổi Mật Khẩu',   Icon: KeyRound, component: <ChangePassword /> },

];

export default function MaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState('maintenance');

  return (
    <DashboardLayout
      title="Bảng Điều Khiển Bảo Trì"
      subtitle="Nhân viên bảo trì — quản lý yêu cầu bảo trì và thiết bị"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

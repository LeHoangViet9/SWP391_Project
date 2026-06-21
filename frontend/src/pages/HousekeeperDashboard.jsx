import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import HousekeepingBoard from '../components/HousekeepingBoard';
import MaintenanceManager from '../components/MaintenanceManager';
import ChangePassword from '../components/ChangePassword';
import AccountInfo from '../components/AccountInfo';
import { LayoutGrid, Hammer, KeyRound, UserCircle } from 'lucide-react';

const TABS = [
  { key: 'housekeeping', label: 'Quản Lý Buồng Phòng', Icon: LayoutGrid, component: <HousekeepingBoard /> },
  { key: 'maintenance',  label: 'Yêu Cầu Bảo Trì',    Icon: Hammer,     component: <MaintenanceManager readOnly />, readOnly: true },
  { key: 'account',      label: 'Thông Tin Tài Khoản',  Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password',     label: 'Đổi Mật Khẩu',        Icon: KeyRound,   component: <ChangePassword /> },
];

export default function HousekeeperDashboard() {
  const [activeTab, setActiveTab] = useState('housekeeping');

  return (
    <DashboardLayout
      title="Bảng Điều Khiển Buồng Phòng"
      subtitle="Nhân viên buồng phòng — quản lý dọn phòng và theo dõi bảo trì"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

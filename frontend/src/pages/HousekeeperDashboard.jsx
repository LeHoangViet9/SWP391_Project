import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import MaintenanceManager from '../components/MaintenanceManager';
import ChangePassword from '../components/ChangePassword';
import { Hammer, KeyRound } from 'lucide-react';

const TABS = [
  { key: 'maintenance', label: 'Yêu Cầu Bảo Trì', Icon: Hammer,  component: <MaintenanceManager readOnly />, readOnly: true },
  { key: 'password',    label: 'Đổi Mật Khẩu',   Icon: KeyRound, component: <ChangePassword /> },
];

export default function HousekeeperDashboard() {
  const [activeTab, setActiveTab] = useState('maintenance');

  return (
    <DashboardLayout
      title="Bảng Điều Khiển Buồng Phòng"
      subtitle="Nhân viên buồng phòng — theo dõi các yêu cầu bảo trì"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

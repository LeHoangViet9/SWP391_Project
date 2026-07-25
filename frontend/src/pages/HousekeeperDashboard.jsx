import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import HousekeepingBoard from '../components/HousekeepingBoard';
import MaintenanceManager from '../components/MaintenanceManager';
import ChangePassword from '../components/ChangePassword';
import AccountInfo from '../components/AccountInfo';
import { LayoutGrid, Hammer, KeyRound, UserCircle } from 'lucide-react';

const TABS = [
  { key: 'housekeeping', label: 'Housekeeping', Icon: LayoutGrid, component: <HousekeepingBoard /> },
  { key: 'maintenance', label: 'Maintenance Requests', Icon: Hammer, component: <MaintenanceManager readOnly />, readOnly: true },
  { key: 'account', label: 'Account Info', Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password', label: 'Change Password', Icon: KeyRound, component: <ChangePassword /> },
];

export default function HousekeeperDashboard() {
  const [activeTab, setActiveTab] = useState('housekeeping');

  return (
    <DashboardLayout
      title="Housekeeping Dashboard"
      subtitle="Housekeeping staff — manage room cleaning and track maintenance"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

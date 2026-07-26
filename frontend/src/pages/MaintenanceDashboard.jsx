import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import MaintenanceManager from '../components/MaintenanceManager';
import EquipmentManager from '../components/EquipmentManager';
import AssignEquipmentToRoom from '../components/AssignEquipmentToRoom';
import ChangePassword from '../components/ChangePassword';
import AccountInfo from '../components/AccountInfo';
import { Hammer, Wrench, KeyRound, UserCircle, PackageCheck } from 'lucide-react';
const TABS = [
  { key: 'maintenance', label: 'Maintenance Requests', Icon: Hammer, component: <MaintenanceManager /> },

  // KEEP:
  // Equipment catalog management screen.
  { key: 'equipments', label: 'Equipment', Icon: Wrench, component: <EquipmentManager /> },

  // NEW:
  // Dedicated screen for assigning equipment to rooms.
  { key: 'assign-equipments', label: 'Assign Equipment', Icon: PackageCheck, component: <AssignEquipmentToRoom /> },

  { key: 'account', label: 'Account Info', Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password', label: 'Change Password', Icon: KeyRound, component: <ChangePassword /> },
];

export default function MaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState('maintenance');

  return (
    <DashboardLayout
      title="Maintenance Dashboard"
      subtitle="Maintenance staff — manage maintenance requests and equipment"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}
import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import BookingManager from '../components/BookingManager';
import CustomerManager from '../components/CustomerManager';
import RoomTypeManager from '../components/RoomTypeManager';
import ChangePassword from '../components/ChangePassword';
import AccountInfo from '../components/AccountInfo';
import { CalendarCheck, Users, Tag, KeyRound, UserCircle } from 'lucide-react';

const TABS = [
  { key: 'bookings', label: 'Bookings', Icon: CalendarCheck, component: <BookingManager /> },
  { key: 'customers', label: 'Customers', Icon: Users, component: <CustomerManager /> },
  { key: 'room-types', label: 'Room Types', Icon: Tag, component: <RoomTypeManager readOnly />, readOnly: true },
  { key: 'account', label: 'Account Info', Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password', label: 'Change Password', Icon: KeyRound, component: <ChangePassword /> },
];

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');

  return (
    <DashboardLayout
      title="Receptionist Dashboard"
      subtitle="Receptionist — manage bookings and customers"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

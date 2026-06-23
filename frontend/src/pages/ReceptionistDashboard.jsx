import React, { useState } from 'react';
import DashboardLayout from '../components/shared/DashboardLayout';
import BookingManager from '../components/BookingManager';
import CustomerManager from '../components/CustomerManager';
import RoomTypeManager from '../components/RoomTypeManager';
import ChangePassword from '../components/ChangePassword';
import AccountInfo from '../components/AccountInfo';
import { CalendarCheck, Users, Tag, KeyRound, UserCircle } from 'lucide-react';

const TABS = [
  { key: 'bookings', label: 'Đặt Phòng', Icon: CalendarCheck, component: <BookingManager /> },
  { key: 'customers', label: 'Khách Hàng', Icon: Users, component: <CustomerManager /> },
  { key: 'room-types', label: 'Loại Phòng', Icon: Tag, component: <RoomTypeManager readOnly />, readOnly: true },
  { key: 'account', label: 'Thông Tin Tài Khoản', Icon: UserCircle, component: <AccountInfo /> },
  { key: 'password', label: 'Đổi Mật Khẩu', Icon: KeyRound, component: <ChangePassword /> },
];

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');

  return (
    <DashboardLayout
      title="Bảng Điều Khiển Lễ Tân"
      subtitle="Nhân viên lễ tân — quản lý đặt phòng và khách hàng"
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

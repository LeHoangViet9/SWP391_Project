import { useState } from 'react';
import { CalendarDays, KeyRound, UserCircle } from 'lucide-react';
import DashboardLayout from '../components/shared/DashboardLayout';
import AccountInfo from '../components/AccountInfo';
import CustomerBookingHistory from '../components/CustomerBookingHistory';
import ChangePassword from '../components/ChangePassword';
import { useLocale } from '../context/LocaleContext';

export default function CustomerDashboard() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { key: 'account', label: t('dashboard.tabs.account'), Icon: UserCircle, component: <AccountInfo /> },
    { key: 'bookingHistory', label: t('dashboard.tabs.bookingHistory'), Icon: CalendarDays, component: <CustomerBookingHistory /> },
    { key: 'password', label: t('dashboard.tabs.password'), Icon: KeyRound, component: <ChangePassword /> },
  ];

  return (
    <DashboardLayout
      title={t('customerDashboard.title')}
      subtitle={t('customerDashboard.subtitle')}
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
}

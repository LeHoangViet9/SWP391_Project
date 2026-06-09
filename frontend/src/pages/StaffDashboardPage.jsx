import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import {
  getAdminDashboard,
  getReceptionistDashboard,
  getMaintenanceDashboard,
} from '../services/dashboardService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  Wrench,
  TrendingUp,
  DollarSign,
  BedDouble,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'bg-[#bfa15f]' }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function AdminDashboardContent({ data, t, locale }) {
  const d = data?.data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label={t('staff.dashboard.todayRevenue')} value={formatCurrency(d?.todayRevenue, locale)} />
        <StatCard icon={TrendingUp} label={t('staff.dashboard.monthRevenue')} value={formatCurrency(d?.thisMonthRevenue, locale)} color="bg-emerald-600" />
        <StatCard icon={CalendarCheck} label={t('staff.dashboard.totalBookings')} value={d?.totalSuccessfulBookings} color="bg-blue-600" />
        <StatCard icon={DollarSign} label={t('staff.dashboard.allTimeRevenue')} value={formatCurrency(d?.totalRevenueAllTime, locale)} color="bg-purple-600" />
      </div>
      {d?.bookingsCountByRoomType && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-800 mb-4">{t('staff.dashboard.bookingsByRoomType')}</h3>
          <div className="space-y-2">
            {Object.entries(d.bookingsCountByRoomType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-slate-600">{type}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReceptionistDashboardContent({ data, t }) {
  const d = data?.data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label={t('staff.dashboard.expectedCheckIns')} value={d?.expectedCheckIns} />
        <StatCard icon={BedDouble} label={t('staff.dashboard.expectedCheckOuts')} value={d?.expectedCheckOuts} color="bg-blue-600" />
        <StatCard icon={Users} label={t('staff.dashboard.actualCheckIns')} value={d?.actualCheckIns} color="bg-emerald-600" />
        <StatCard icon={Users} label={t('staff.dashboard.pendingBookings')} value={d?.pendingBookings} color="bg-amber-600" />
      </div>
      <Link to="/staff/bookings/today" className="inline-flex btn-gold px-4 py-2 rounded-lg text-sm">
        {t('staff.nav.bookingToday')}
      </Link>
    </div>
  );
}

function MaintenanceDashboardContent({ data, t, locale }) {
  const d = data?.data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wrench} label={t('staff.dashboard.totalRequests')} value={d?.totalRequests} />
        <StatCard icon={Wrench} label={t('staff.dashboard.pendingRequests')} value={d?.pendingRequests} color="bg-amber-600" />
        <StatCard icon={Wrench} label={t('staff.dashboard.inProgress')} value={d?.inProgressRequests} color="bg-blue-600" />
        <StatCard icon={Wrench} label={t('staff.dashboard.completed')} value={d?.completedRequests} color="bg-emerald-600" />
      </div>
      <p className="text-sm text-slate-500">
        {t('staff.dashboard.totalCost')}: {formatCurrency(d?.totalCost, locale)}
      </p>
      <Link to="/staff/equipments" className="inline-flex btn-gold px-4 py-2 rounded-lg text-sm">
        {t('staff.nav.equipments')}
      </Link>
    </div>
  );
}

function HousekeeperDashboardContent({ t }) {
  return (
    <div className="space-y-4">
      <p className="text-slate-500 text-sm">{t('staff.dashboard.housekeeperDesc')}</p>
      <Link to="/staff/bookings/today" className="inline-flex btn-gold px-4 py-2 rounded-lg text-sm">
        {t('staff.nav.bookingToday')}
      </Link>
    </div>
  );
}

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const role = user?.roleName;

  const adminQuery = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: getAdminDashboard,
    enabled: role === 'ADMIN' || role === 'MANAGER',
  });

  const receptionistQuery = useQuery({
    queryKey: ['dashboard-receptionist'],
    queryFn: getReceptionistDashboard,
    enabled: role === 'RECEPTIONIST',
  });

  const maintenanceQuery = useQuery({
    queryKey: ['dashboard-maintenance'],
    queryFn: getMaintenanceDashboard,
    enabled: role === 'MAINTENANCE',
  });

  const isLoading =
    (role === 'ADMIN' || role === 'MANAGER') && adminQuery.isLoading ||
    role === 'RECEPTIONIST' && receptionistQuery.isLoading ||
    role === 'MAINTENANCE' && maintenanceQuery.isLoading;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-800 mb-1">
        {t('staff.dashboard.welcome')}, {user?.fullName}
      </h1>
      <p className="text-slate-500 text-sm mb-6">{t('staff.dashboard.subtitle')}</p>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {(role === 'ADMIN' || role === 'MANAGER') && (
            <AdminDashboardContent data={adminQuery.data} t={t} locale={locale} />
          )}
          {role === 'RECEPTIONIST' && (
            <ReceptionistDashboardContent data={receptionistQuery.data} t={t} />
          )}
          {role === 'MAINTENANCE' && (
            <MaintenanceDashboardContent data={maintenanceQuery.data} t={t} locale={locale} />
          )}
          {role === 'HOUSEKEEPER' && <HousekeeperDashboardContent t={t} />}
        </>
      )}
    </div>
  );
}

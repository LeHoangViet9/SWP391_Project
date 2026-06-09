import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, CalendarDays, TrendingUp, Eye } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  getCheckInBookings,
  getCheckOutBookings,
} from '../../services/bookingService';
import { todayDateString, toISODateTimeStart, toISODateTimeEnd, formatDate, formatCurrency } from '../../utils/formatters';
import StatusBadge from '../../components/ui/StatusBadge';
import SkeletonTable from '../../components/ui/SkeletonTable';
import { PAGE_SIZE } from '../../utils/constants';

function StatBlock({ icon: Icon, label, value, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Icon size={18} className="text-white/70" />
          <span className="text-xs text-white/60 uppercase tracking-wider font-medium">{label}</span>
        </div>
        <p className="text-3xl font-bold text-white">{value ?? 0}</p>
      </div>
    </div>
  );
}

function BookingTable({ items, t, locale, loading }) {
  if (loading) return <SkeletonTable columns={6} rows={3} />;
  if (!items?.length) {
    return <p className="text-sm text-slate-400 py-8 text-center">{t('staff.common.noData')}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="hms-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t('staff.booking.customer')}</th>
            <th>{t('bookingPage.roomType')}</th>
            <th>{t('booking.checkIn')}</th>
            <th>{t('booking.checkOut')}</th>
            <th>{t('bookingPage.status')}</th>
            <th className="text-right">{t('bookingPage.total')}</th>
            <th className="text-right">{t('staff.common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id}>
              <td className="text-slate-400">#{b.id}</td>
              <td className="font-medium">{b.customerName}</td>
              <td>{b.roomTypeName}</td>
              <td className="text-sm">{formatDate(b.checkInDate, locale)}</td>
              <td className="text-sm">{formatDate(b.checkOutDate, locale)}</td>
              <td><StatusBadge status={b.bookingStatus} /></td>
              <td className="text-right font-medium">{formatCurrency(b.totalPrice, locale)}</td>
              <td className="text-right">
                <Link
                  to={`/staff/bookings/${b.id}`}
                  className="p-1.5 text-slate-400 hover:text-[#bfa15f] border border-stone-200 rounded-md inline-flex transition-colors"
                >
                  <Eye size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BookingDashboard() {
  const { t, locale } = useLocale();
  const today = todayDateString();
  const params = {
    start: toISODateTimeStart(today),
    end: toISODateTimeEnd(today),
    page: 0,
    size: PAGE_SIZE,
  };

  const checkInQuery = useQuery({
    queryKey: ['bookings-checkin-today', today],
    queryFn: () => getCheckInBookings(params),
  });

  const checkOutQuery = useQuery({
    queryKey: ['bookings-checkout-today', today],
    queryFn: () => getCheckOutBookings(params),
  });

  const checkInItems = checkInQuery.data?.data?.content || [];
  const checkOutItems = checkOutQuery.data?.data?.content || [];

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('staff.booking.todayTitle')}</h1>
          <p className="page-subtitle">{t('staff.booking.todaySubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <CalendarDays size={16} />
          {new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
        <StatBlock
          icon={LogIn}
          label={t('staff.booking.checkInToday')}
          value={checkInItems.length}
          color="stat-card--emerald"
        />
        <StatBlock
          icon={LogOut}
          label={t('staff.booking.checkOutToday')}
          value={checkOutItems.length}
          color="stat-card--blue"
        />
        <StatBlock
          icon={TrendingUp}
          label={t('bookingPage.total') + ' Check-in'}
          value={formatCurrency(checkInItems.reduce((sum, b) => sum + (b.totalPrice || 0), 0), locale)}
          color="stat-card--gold"
        />
        <StatBlock
          icon={TrendingUp}
          label={t('bookingPage.total') + ' Check-out'}
          value={formatCurrency(checkOutItems.reduce((sum, b) => sum + (b.totalPrice || 0), 0), locale)}
          color="stat-card--purple"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Check-in */}
        <div className="hms-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <LogIn className="text-emerald-600" size={16} />
            </div>
            <h2 className="font-semibold text-slate-800">{t('staff.booking.checkInToday')}</h2>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              {checkInItems.length}
            </span>
          </div>
          <BookingTable items={checkInItems} t={t} locale={locale} loading={checkInQuery.isLoading} />
        </div>

        {/* Check-out */}
        <div className="hms-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LogOut className="text-blue-600" size={16} />
            </div>
            <h2 className="font-semibold text-slate-800">{t('staff.booking.checkOutToday')}</h2>
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {checkOutItems.length}
            </span>
          </div>
          <BookingTable items={checkOutItems} t={t} locale={locale} loading={checkOutQuery.isLoading} />
        </div>
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { LogIn, LogOut } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  getCheckInBookings,
  getCheckOutBookings,
} from '../../services/bookingService';
import { todayDateString, toISODateTimeStart, toISODateTimeEnd, formatDate, formatCurrency } from '../../utils/formatters';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { PAGE_SIZE } from '../../utils/constants';

function BookingTable({ items, t, locale }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-400 py-4">{t('staff.common.noData')}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            <th className="text-left py-2 font-semibold text-slate-600">ID</th>
            <th className="text-left py-2 font-semibold text-slate-600">{t('staff.booking.customer')}</th>
            <th className="text-left py-2 font-semibold text-slate-600">{t('bookingPage.roomType')}</th>
            <th className="text-left py-2 font-semibold text-slate-600">{t('booking.checkIn')}</th>
            <th className="text-left py-2 font-semibold text-slate-600">{t('booking.checkOut')}</th>
            <th className="text-left py-2 font-semibold text-slate-600">{t('bookingPage.status')}</th>
            <th className="text-right py-2 font-semibold text-slate-600">{t('bookingPage.total')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {items.map((b) => (
            <tr key={b.id}>
              <td className="py-2.5">{b.id}</td>
              <td className="py-2.5">{b.customerName}</td>
              <td className="py-2.5">{b.roomTypeName}</td>
              <td className="py-2.5">{formatDate(b.checkInDate, locale)}</td>
              <td className="py-2.5">{formatDate(b.checkOutDate, locale)}</td>
              <td className="py-2.5"><StatusBadge status={b.bookingStatus} /></td>
              <td className="py-2.5 text-right">{formatCurrency(b.totalPrice, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BookingTodayPage() {
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
    queryFn: () => getCheckInBookings(params, locale),
  });

  const checkOutQuery = useQuery({
    queryKey: ['bookings-checkout-today', today],
    queryFn: () => getCheckOutBookings(params, locale),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-800 mb-1">
        {t('staff.booking.todayTitle')}
      </h1>
      <p className="text-slate-500 text-sm mb-6">{t('staff.booking.todaySubtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <LogIn className="text-emerald-600" size={18} />
            </div>
            <h2 className="font-semibold text-slate-800">{t('staff.booking.checkInToday')}</h2>
          </div>
          {checkInQuery.isLoading ? (
            <LoadingSpinner />
          ) : (
            <BookingTable items={checkInQuery.data?.data?.content} t={t} locale={locale} />
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LogOut className="text-blue-600" size={18} />
            </div>
            <h2 className="font-semibold text-slate-800">{t('staff.booking.checkOutToday')}</h2>
          </div>
          {checkOutQuery.isLoading ? (
            <LoadingSpinner />
          ) : (
            <BookingTable items={checkOutQuery.data?.data?.content} t={t} locale={locale} />
          )}
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import DataTable from './shared/DataTable';
import { useLocale } from '../context/LocaleContext';
import { getMyBookingHistory } from '../services/bookingService';

function formatDateTime(value, locale) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatMoney(value, locale) {
  if (value == null) return '-';
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700',
  CHECKED_OUT: 'bg-slate-100 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
};

export default function CustomerBookingHistory() {
  const { locale, t } = useLocale();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyBookingHistory({ page: nextPage, size: 10 }, locale);
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (err) {
      setError(err.message || t('bookingHistory.loadError'));
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, locale, t]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const columns = [
    t('bookingHistory.columns.id'),
    t('bookingHistory.columns.roomType'),
    t('bookingHistory.columns.quantity'),
    t('bookingHistory.columns.checkIn'),
    t('bookingHistory.columns.checkOut'),
    t('bookingHistory.columns.status'),
    t('bookingHistory.columns.totalPrice'),
    t('bookingHistory.columns.createdAt'),
  ];

  const rows = items.map((item) => {
    const status = item.bookingStatus || item.status || 'PENDING';
    return (
      <tr key={item.id} className="hover:bg-stone-50">
        <td className="px-4 py-3 font-mono text-xs font-bold">#{item.id}</td>
        <td className="px-4 py-3 text-sm font-semibold text-slate-800">{item.roomTypeName || '-'}</td>
        <td className="px-4 py-3 text-center text-sm">{item.quantity ?? '-'}</td>
        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(item.checkInDate, locale)}</td>
        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(item.checkOutDate, locale)}</td>
        <td className="px-4 py-3">
          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-600'}`}>
            {t(`booking.status.${status}`)}
          </span>
        </td>
        <td className="px-4 py-3 text-xs font-bold text-[#bfa15f]">{formatMoney(item.totalPrice, locale)}</td>
        <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(item.createdAt, locale)}</td>
      </tr>
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
            <CalendarDays size={18} className="text-[#bfa15f]" />
            {t('bookingHistory.title')}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t('bookingHistory.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchData(page)}
          className="inline-flex items-center justify-center gap-2 rounded border border-stone-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-[#bfa15f] hover:text-[#bfa15f]"
        >
          <RefreshCw size={15} />
          {t('bookingHistory.refresh')}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText={t('bookingHistory.emptyText')}
      />
    </div>
  );
}

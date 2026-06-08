import { useEffect, useState } from 'react';
import {
  TrendingUp, DollarSign, CalendarCheck, BarChart2,
  CreditCard, RefreshCw, AlertCircle, Users, BedDouble, Tag, UserCheck
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { useLocale } from '../context/LocaleContext';

const COLORS = ['#bfa15f', '#0c192c', '#4f8ef7', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatVND(value, locale = 'vi') {
  if (!value && value !== 0) return '—';
  const num = Number(value);
  if (locale === 'en') {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    return new Intl.NumberFormat('en-US').format(num);
  }
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} tỷ`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} tr`;
  return new Intl.NumberFormat('vi-VN').format(num);
}

function formatDate(label) {
  if (!label) return '';
  const d = new Date(label);
  return isNaN(d) ? label : `${d.getDate()}/${d.getMonth() + 1}`;
}

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color = '#bfa15f' }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Bar Chart (pure CSS) ────────────────────────────────────────────────────
function BarChart({ data, locale = 'vi' }) {
  if (!data || data.length === 0) return <EmptyChart locale={locale} />;
  const max = Math.max(...data.map(d => Number(d.value)), 1);
  return (
    <div className="flex items-end gap-2 h-44 w-full">
      {data.map((point, i) => {
        const pct = Math.round((Number(point.value) / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex flex-col justify-end" style={{ height: '140px' }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#0c192c] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {formatVND(point.value, locale)} ₫
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all duration-700"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: `linear-gradient(to top, #bfa15f, #d4b87a)`,
                  minHeight: '3px',
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{formatDate(point.label)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Horizontal Bar (for categories) ────────────────────────────────────────
function HorizBar({ label, value, max, color, unit = '', locale = 'vi' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-700 truncate max-w-[60%]">{label}</span>
        <span className="text-slate-500">{unit ? `${formatVND(value, locale)} ${unit}` : value}</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function EmptyChart({ locale = 'vi' }) {
  return (
    <div className="h-44 flex items-center justify-center text-slate-300 text-sm">
      {locale === 'vi' ? 'Chưa có dữ liệu' : 'No data available'}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ReportManager() {
  const { locale, t } = useLocale();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/dashboards/admin', {}, locale);
      setData(res.data);
    } catch (err) {
      setError(err.message || t('report.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60 gap-3 text-slate-400">
        <RefreshCw size={20} className="animate-spin text-[#bfa15f]" />
        <span className="text-sm">{t('report.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={fetchData}
          className="text-xs px-4 py-2 bg-[#bfa15f] text-white rounded hover:bg-[#a88a50] transition-colors"
        >
          {t('report.retry')}
        </button>
      </div>
    );
  }

  const roomTypeEntries = Object.entries(data?.bookingsCountByRoomType || {});
  const paymentEntries = Object.entries(data?.revenueByPaymentMethod || {});
  const maxRoomType = Math.max(...roomTypeEntries.map(([, v]) => Number(v)), 1);
  const maxPayment = Math.max(...paymentEntries.map(([, v]) => Number(v)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">{t('report.title')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{t('report.subtitle')}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-stone-200 rounded-lg hover:border-[#bfa15f] hover:text-[#bfa15f] transition-colors text-slate-500"
        >
          <RefreshCw size={13} />
          {t('report.refresh')}
        </button>
      </div>

      {/* KPI Cards — Doanh thu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label={t('report.kpi.totalRevenue')}
          value={`${formatVND(data?.totalRevenueAllTime, locale)} ₫`}
          sub={t('report.kpi.allTime')}
          color="#bfa15f"
        />
        <KpiCard
          icon={TrendingUp}
          label={t('report.kpi.revenueToday')}
          value={`${formatVND(data?.todayRevenue, locale)} ₫`}
          sub={locale === 'vi' ? new Date().toLocaleDateString('vi-VN') : new Date().toLocaleDateString('en-US')}
          color="#22c55e"
        />
        <KpiCard
          icon={BarChart2}
          label={t('report.kpi.revenueThisMonth')}
          value={`${formatVND(data?.thisMonthRevenue, locale)} ₫`}
          sub={locale === 'vi' ? `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}` : `Month ${new Date().getMonth() + 1}/${new Date().getFullYear()}`}
          color="#4f8ef7"
        />
        <KpiCard
          icon={CalendarCheck}
          label={t('report.kpi.successfulBookings')}
          value={data?.totalSuccessfulBookings ?? '—'}
          sub={t('report.kpi.bookingsCount')}
          color="#8b5cf6"
        />
      </div>

      {/* KPI Cards — Tổng quan hệ thống */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label={t('report.kpi.customers')}
          value={data?.totalCustomers ?? '—'}
          sub={t('report.kpi.totalCustomers')}
          color="#06b6d4"
        />
        <KpiCard
          icon={Tag}
          label={t('report.kpi.roomTypes')}
          value={data?.totalRoomTypes ?? '—'}
          sub={t('report.kpi.totalRoomTypes')}
          color="#f59e0b"
        />
        <KpiCard
          icon={BedDouble}
          label={t('report.kpi.rooms')}
          value={data?.totalRooms ?? '—'}
          sub={t('report.kpi.totalRooms')}
          color="#10b981"
        />
        <KpiCard
          icon={UserCheck}
          label={t('report.kpi.staff')}
          value={data?.totalStaff ?? '—'}
          sub={t('report.kpi.totalStaff')}
          color="#f43f5e"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#bfa15f]" />
            <h4 className="text-sm font-bold text-slate-800">{t('report.charts.revenueTrend')}</h4>
          </div>
          <BarChart data={data?.revenueTrend?.map(p => ({ label: p.label, value: p.value }))} locale={locale} />
        </div>

        {/* Revenue by Payment Method */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-[#bfa15f]" />
            <h4 className="text-sm font-bold text-slate-800">{t('report.charts.revenuePaymentMethod')}</h4>
          </div>
          {paymentEntries.length === 0 ? (
            <EmptyChart locale={locale} />
          ) : (
            <div className="space-y-4 py-2">
              {paymentEntries.map(([method, value], i) => (
                <HorizBar
                  key={method}
                  label={method}
                  value={Number(value)}
                  max={maxPayment}
                  color={COLORS[i % COLORS.length]}
                  unit="₫"
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bookings by Room Type */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-[#bfa15f]" />
          <h4 className="text-sm font-bold text-slate-800">{t('report.charts.bookingsRoomType')}</h4>
        </div>
        {roomTypeEntries.length === 0 ? (
          <EmptyChart locale={locale} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {roomTypeEntries.map(([type, count], i) => (
              <HorizBar
                key={type}
                label={type}
                value={Number(count)}
                max={maxRoomType}
                color={COLORS[i % COLORS.length]}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

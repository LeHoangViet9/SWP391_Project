import {
  TrendingUp, BarChart2, CreditCard, RefreshCw
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import DashboardCard from './DashboardCard';
import { adminDashboardCards } from '../data/dashboardData';

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
export default function ReportManager({ data, refetch }) {
  const { locale, t } = useLocale();

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
          onClick={refetch}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-stone-200 rounded-lg hover:border-[#bfa15f] hover:text-[#bfa15f] transition-colors text-slate-500"
        >
          <RefreshCw size={13} />
          {t('report.refresh')}
        </button>
      </div>

      {/* KPI Cards — Doanh thu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminDashboardCards.slice(0, 4).map((card) => (
          <DashboardCard
            key={card.key}
            title={t(card.titleKey)}
            value={card.getValue(data, formatVND, locale)}
            icon={card.icon}
            linkPath={card.linkPath}
            color={card.color}
            sub={card.getSub ? card.getSub(data, locale) : (card.subKey ? t(card.subKey) : undefined)}
          />
        ))}
      </div>

      {/* KPI Cards — Tổng quan hệ thống */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminDashboardCards.slice(4, 8).map((card) => (
          <DashboardCard
            key={card.key}
            title={t(card.titleKey)}
            value={card.getValue(data, formatVND, locale)}
            icon={card.icon}
            linkPath={card.linkPath}
            color={card.color}
            sub={card.getSub ? card.getSub(data, locale) : (card.subKey ? t(card.subKey) : undefined)}
          />
        ))}
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

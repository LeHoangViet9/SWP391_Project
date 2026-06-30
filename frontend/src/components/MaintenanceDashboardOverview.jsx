import { RefreshCw, Activity } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import DashboardCard from './DashboardCard';
import { maintenanceDashboardCards } from '../data/dashboardData';

function formatVND(value, locale = 'vi') {
  if (!value && value !== 0) return '0';
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

function SeverityBar({ label, count, max, color }) {
  const percentage = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-700 font-semibold">{label}</span>
        <span className="text-slate-500">{count} yêu cầu ({percentage}%)</span>
      </div>
      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function MaintenanceDashboardOverview({ data, refetch }) {
  const { locale } = useLocale();

  const severityMap = data?.requestsBySeverity || {};
  const totalSeverityCount = Object.values(severityMap).reduce((a, b) => a + Number(b), 0) || 1;

  const SEVERITY_DETAILS = [
    { key: 'CRITICAL', label: 'Khẩn cấp (CRITICAL)', color: '#ef4444' },
    { key: 'HIGH', label: 'Mức độ cao (HIGH)', color: '#f97316' },
    { key: 'MEDIUM', label: 'Trung bình (MEDIUM)', color: '#eab308' },
    { key: 'LOW', label: 'Thấp (LOW)', color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Bảng điều khiển bảo trì</h3>
          <p className="text-xs text-slate-400 mt-0.5">Theo dõi chi phí sửa chữa và các mức độ nghiêm trọng của sự cố</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-stone-200 rounded-lg hover:border-[#bfa15f] hover:text-[#bfa15f] transition-colors text-slate-500"
        >
          <RefreshCw size={13} />
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {maintenanceDashboardCards.map((card) => (
          <DashboardCard
            key={card.key}
            title={card.title}
            value={card.getValue(data, formatVND, locale)}
            icon={card.icon}
            linkPath={card.linkPath}
            color={card.color}
          />
        ))}
      </div>

      {/* Severity Breakdown */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={18} className="text-[#bfa15f]" />
          <h4 className="text-sm font-bold text-slate-800">Phân bố sự cố theo mức độ nghiêm trọng</h4>
        </div>
        <div className="space-y-4 max-w-3xl">
          {SEVERITY_DETAILS.map(sev => {
            const count = Number(severityMap[sev.key] || 0);
            return (
              <SeverityBar
                key={sev.key}
                label={sev.label}
                count={count}
                max={totalSeverityCount}
                color={sev.color}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

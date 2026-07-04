import React from 'react';
import {
  Hammer, AlertCircle, Wrench, CheckCircle2,
  RefreshCw, DollarSign, Activity
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

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

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex items-start gap-4 hover:shadow-md transition-all duration-300">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
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
        <KpiCard
          icon={Hammer}
          label="Tổng yêu cầu"
          value={data?.totalRequests ?? 0}
          color="#64748b"
        />
        <KpiCard
          icon={AlertCircle}
          label="Chưa xử lý"
          value={data?.pendingRequests ?? 0}
          color="#ef4444"
        />
        <KpiCard
          icon={Wrench}
          label="Đang sửa chữa"
          value={data?.inProgressRequests ?? 0}
          color="#3b82f6"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Đã hoàn thành"
          value={data?.completedRequests ?? 0}
          color="#10b981"
        />
        <KpiCard
          icon={DollarSign}
          label="Tổng chi phí"
          value={`${formatVND(data?.totalCost, locale)} ₫`}
          color="#bfa15f"
        />
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

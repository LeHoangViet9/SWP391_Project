import React from 'react';
import {
  ClipboardList, AlertTriangle, Sparkles, CheckCircle2,
  RefreshCw, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function HousekeeperDashboardOverview({ data, refetch }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Bảng điều khiển buồng phòng</h3>
          <p className="text-xs text-slate-400 mt-0.5">Theo dõi lịch dọn phòng, phòng bẩn cần xử lý khẩn cấp</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={ClipboardList}
          label="Nhiệm vụ của tôi hôm nay"
          value={data?.myAssignedTasksCount ?? 0}
          color="#bfa15f"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Phòng đang bẩn (DIRTY)"
          value={data?.dirtyRoomsCount ?? 0}
          color="#ef4444"
        />
        <KpiCard
          icon={Sparkles}
          label="Phòng đang dọn (CLEANING)"
          value={data?.cleaningRoomsCount ?? 0}
          color="#3b82f6"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Phòng trống sẵn sàng (AVAILABLE)"
          value={data?.availableRoomsCount ?? 0}
          color="#10b981"
        />
      </div>

      {/* Quick Action Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start text-emerald-600 font-semibold text-sm">
            <ShieldCheck size={18} />
            <span>Sẵn sàng phục vụ khách lưu trú</span>
          </div>
          <h4 className="text-base font-bold text-slate-800">Quản lý các nhiệm vụ buồng phòng</h4>
          <p className="text-sm text-slate-500 max-w-2xl">
            Hãy bắt đầu cập nhật trạng thái làm sạch cho phòng bẩn (DIRTY) để chuyển trạng thái sang Đang dọn dẹp (CLEANING), sau đó hoàn thành để chuyển sang Sẵn sàng (AVAILABLE).
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/housekeeping')}
          className="flex items-center gap-2 text-xs px-5 py-3 bg-[#bfa15f] hover:bg-[#a88a50] text-white font-bold rounded-lg shadow-sm transition-all duration-300 cursor-pointer whitespace-nowrap"
        >
          Xem bảng công việc của tôi
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

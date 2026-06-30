import { RefreshCw, BedDouble } from 'lucide-react';
import DashboardCard from './DashboardCard';
import { receptionDashboardCards } from '../data/dashboardData';

function StatusBar({ label, count, color, percentage }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-700 font-semibold">{label}</span>
        <span className="text-slate-500">{count} phòng ({percentage}%)</span>
      </div>
      <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ReceptionistDashboardOverview({ data, refetch }) {
  const roomStatus = data?.roomStatusOverview || {};
  const totalRooms = Object.values(roomStatus).reduce((a, b) => a + Number(b), 0) || 1;

  const STATUS_DETAILS = [
    { key: 'AVAILABLE', label: 'Phòng trống sẵn sàng', color: '#10b981' },
    { key: 'READY', label: 'Phòng dọn xong (chờ duyệt)', color: '#22c55e' },
    { key: 'OCCUPIED', label: 'Phòng đang có khách', color: '#3b82f6' },
    { key: 'RESERVED', label: 'Phòng đã đặt trước', color: '#6366f1' },
    { key: 'CLEANING', label: 'Phòng đang dọn dẹp', color: '#f59e0b' },
    { key: 'DIRTY', label: 'Phòng bẩn cần dọn dẹp', color: '#f97316' },
    { key: 'MAINTENANCE', label: 'Phòng đang bảo trì', color: '#ef4444' },
    { key: 'CHECKOUT_PENDING', label: 'Chờ check-out', color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Bảng điều khiển lễ tân</h3>
          <p className="text-xs text-slate-400 mt-0.5">Theo dõi hoạt động check-in, check-out và trạng thái phòng</p>
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
        {receptionDashboardCards.map((card) => (
          <DashboardCard
            key={card.key}
            title={card.title}
            value={card.getValue(data)}
            icon={card.icon}
            linkPath={card.linkPath}
            color={card.color}
          />
        ))}
      </div>

      {/* Room Status Overview */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BedDouble size={18} className="text-[#bfa15f]" />
          <h4 className="text-sm font-bold text-slate-800">Trạng thái phòng hiện tại</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {STATUS_DETAILS.map(status => {
            const count = Number(roomStatus[status.key] || 0);
            const percentage = Math.round((count / totalRooms) * 100);
            return (
              <StatusBar
                key={status.key}
                label={status.label}
                count={count}
                percentage={percentage}
                color={status.color}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

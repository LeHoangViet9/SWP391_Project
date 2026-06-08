import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  LogIn,
  LogOut,
  Clock,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import {
  getAdminDashboard,
  getReceptionistDashboard,
  getMaintenanceDashboard,
} from '../../services/dashboardService';
import StatCard from '../../components/dashboard/StatCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import MapChart from '../../components/dashboard/MapChart';
import Alert from '../../components/common/Alert';
import { formatCurrency } from '../../utils/format';

function AdminDashboardView({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(data.todayRevenue)}
          icon={DollarSign}
        />
        <StatCard
          title="Doanh thu tháng này"
          value={formatCurrency(data.thisMonthRevenue)}
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(data.totalRevenueAllTime)}
          icon={DollarSign}
          accent="blue"
        />
        <StatCard
          title="Đặt phòng thành công"
          value={data.totalSuccessfulBookings ?? 0}
          icon={CalendarCheck}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
            Xu hướng doanh thu 7 ngày
          </h2>
          <RevenueChart data={data.revenueTrend || []} />
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <MapChart
            title="Đặt phòng theo loại phòng"
            data={data.bookingsCountByRoomType}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
        <MapChart
          title="Doanh thu theo phương thức thanh toán"
          data={data.revenueByPaymentMethod}
        />
      </div>
    </div>
  );
}

function ReceptionistDashboardView({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Check-in dự kiến"
          value={data.expectedCheckIns ?? 0}
          icon={LogIn}
        />
        <StatCard
          title="Check-in thực tế"
          value={data.actualCheckIns ?? 0}
          icon={LogIn}
          accent="green"
        />
        <StatCard
          title="Check-out dự kiến"
          value={data.expectedCheckOuts ?? 0}
          icon={LogOut}
          accent="blue"
        />
        <StatCard
          title="Check-out thực tế"
          value={data.actualCheckOuts ?? 0}
          icon={LogOut}
          accent="purple"
        />
        <StatCard
          title="Đơn chờ xử lý"
          value={data.pendingBookings ?? 0}
          icon={Clock}
          accent="red"
        />
      </div>
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
        <MapChart title="Tổng quan trạng thái phòng" data={data.roomStatusOverview} />
      </div>
    </div>
  );
}

function MaintenanceDashboardView({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tổng phiếu" value={data.totalRequests ?? 0} icon={Wrench} />
        <StatCard
          title="Đang chờ"
          value={data.pendingRequests ?? 0}
          icon={Clock}
          accent="red"
        />
        <StatCard
          title="Đang xử lý"
          value={data.inProgressRequests ?? 0}
          icon={Wrench}
          accent="purple"
        />
        <StatCard
          title="Hoàn thành"
          value={data.completedRequests ?? 0}
          icon={CalendarCheck}
          accent="green"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <StatCard
            title="Tổng chi phí bảo trì"
            value={formatCurrency(data.totalCost)}
            icon={DollarSign}
            accent="gold"
          />
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Theo mức độ nghiêm trọng
          </h2>
          <MapChart data={data.requestsBySeverity} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.roleName;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        let res;
        if (role === 'ADMIN') {
          res = await getAdminDashboard(locale);
        } else if (role === 'RECEPTIONIST') {
          res = await getReceptionistDashboard(locale);
        } else if (role === 'MAINTENANCE') {
          res = await getMaintenanceDashboard(locale);
        } else {
          res = await getReceptionistDashboard(locale);
        }
        if (!cancelled) setData(res?.data || null);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [role, locale]);

  const titles = {
    ADMIN: 'Tổng quan quản trị',
    RECEPTIONIST: 'Tổng quan lễ tân',
    MAINTENANCE: 'Tổng quan bảo trì',
    HOUSEKEEPER: 'Tổng quan buồng phòng',
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">
        {titles[role] || 'Tổng quan'}
      </h1>
      <Alert type="error" message={error} />
      {loading ? (
        <div className="text-center py-16 text-slate-400">Đang tải dữ liệu...</div>
      ) : data && role === 'ADMIN' ? (
        <AdminDashboardView data={data} />
      ) : data && role === 'RECEPTIONIST' ? (
        <ReceptionistDashboardView data={data} />
      ) : data && role === 'MAINTENANCE' ? (
        <MaintenanceDashboardView data={data} />
      ) : (
        <div className="text-center py-16 text-slate-400">
          Không có dashboard cho vai trò này.
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { apiFetch } from '../services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';
import ReportManager from './ReportManager';
import ReceptionistDashboardOverview from './ReceptionistDashboardOverview';
import HousekeeperDashboardOverview from './HousekeeperDashboardOverview';
import MaintenanceDashboardOverview from './MaintenanceDashboardOverview';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const roleName = user?.roleName?.toUpperCase();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/dashboards', {}, locale);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60 gap-3 text-slate-400">
        <RefreshCw size={20} className="animate-spin text-[#bfa15f]" />
        <span className="text-sm">Đang tải bảng điều khiển...</span>
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
          Thử lại
        </button>
      </div>
    );
  }

  if (roleName === 'ADMIN' || roleName === 'MANAGER') {
    return <ReportManager data={data} refetch={fetchData} />;
  }
  if (roleName === 'RECEPTIONIST') {
    return <ReceptionistDashboardOverview data={data} refetch={fetchData} />;
  }
  if (roleName === 'HOUSEKEEPER') {
    return <HousekeeperDashboardOverview data={data} refetch={fetchData} />;
  }
  if (roleName === 'MAINTENANCE') {
    return <MaintenanceDashboardOverview data={data} refetch={fetchData} />;
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-stone-200 shadow-sm text-center py-12">
      <h3 className="text-lg font-bold text-slate-800">
        {user?.fullName ? `Xin chào, ${user.fullName}!` : 'Xin chào!'}
      </h3>
      <p className="text-slate-500 text-sm mt-2">
        Vui lòng chọn một chức năng từ danh mục bên trái để tiếp tục.
      </p>
    </div>
  );
}

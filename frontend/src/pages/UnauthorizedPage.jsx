import { Link, useLocation } from 'react-router-dom';
import { ShieldX, Home, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDefaultDashboardPath, isStaffRole } from '../utils/roleAccess';

export default function UnauthorizedPage() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const from = location.state?.from;

  const dashboardPath = isStaffRole(user?.roleName)
    ? getDefaultDashboardPath(user.roleName)
    : '/';

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldX size={32} className="text-red-500" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-slate-800 mb-2">
          Không có quyền truy cập
        </h1>
        <p className="text-slate-500 text-sm mb-2">
          Tài khoản của bạn không được phép truy cập trang này.
        </p>
        {from && (
          <p className="text-xs text-slate-400 mb-6">
            Đường dẫn: <code className="bg-stone-100 px-1 rounded">{from}</code>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-stone-50"
          >
            <Home size={16} />
            Trang chủ
          </Link>
          {isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="inline-flex items-center justify-center gap-2 btn-gold px-4 py-2.5 rounded-lg text-sm"
            >
              Về bảng điều khiển
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 btn-gold px-4 py-2.5 rounded-lg text-sm"
            >
              <LogIn size={16} />
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

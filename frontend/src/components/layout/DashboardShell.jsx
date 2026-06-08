import { Link } from 'react-router-dom';
import { Crown, LogOut, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../constants/enums';

export default function DashboardShell({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="sticky top-0 z-30 bg-royal-dark text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#bfa15f] rounded flex items-center justify-center shrink-0">
              <Crown size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm truncate">{title}</p>
              <p className="text-[10px] text-[#bfa15f] uppercase tracking-wider truncate">
                {ROLE_LABELS[user?.roleName] || user?.roleName} · {user?.fullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/10"
            >
              <Home size={15} />
              Trang chủ
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 rounded-lg"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}

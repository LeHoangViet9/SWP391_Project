import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Crown,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Users,
  Wrench,
  UserCog,
  KeyRound,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { getNavItems } from '../../utils/roleAccess';

const ICON_MAP = {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Users,
  Wrench,
  UserCog,
  KeyRound,
  UserCircle,
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = getNavItems(user?.roleName, t);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #1a2332 0%, #0f1721 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <Link to="/staff/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #bfa15f 0%, #d4a843 100%)' }}>
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-white tracking-wide">HMS Staff</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#cda152]">Management</p>
            </div>
          </Link>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User info in sidebar */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                 style={{ background: 'linear-gradient(135deg, #bfa15f 0%, #a88a4a 100%)' }}>
              {getInitials(user?.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{user?.roleName}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/staff/dashboard'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link sidebar-link--active' : 'sidebar-link sidebar-link--inactive'
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={16} />
            {t('auth.logout')}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200/80 px-4 md:px-6 h-14 flex items-center justify-between">
          <button
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Locale switcher */}
            <div className="flex gap-1 text-xs font-medium bg-stone-100 rounded-full p-0.5">
              <button
                onClick={() => setLocale('vi')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  locale === 'vi'
                    ? 'bg-white text-[#bfa15f] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                VI
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  locale === 'en'
                    ? 'bg-white text-[#bfa15f] shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                EN
              </button>
            </div>

            {/* User info (desktop) */}
            <Link to="/staff/profile" className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
                <p className="text-[10px] text-slate-400">{user?.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                   style={{ background: 'linear-gradient(135deg, #bfa15f 0%, #a88a4a 100%)' }}>
                {getInitials(user?.fullName)}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

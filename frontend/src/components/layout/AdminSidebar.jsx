import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Layers,
  Users,
  Wrench,
  Cpu,
  Crown,
  LogOut,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNavItems } from '../../utils/roleAccess';
import { ROLE_LABELS } from '../../constants/enums';

const ICON_MAP = {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Layers,
  Users,
  Wrench,
  Cpu,
};

export default function AdminSidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navItems = getNavItems(user?.roleName);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-royal-dark text-white z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-10 h-10 bg-[#bfa15f] rounded flex items-center justify-center shrink-0">
          <Crown size={20} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-display font-bold text-sm leading-tight truncate">HMS Admin</p>
            <p className="text-[10px] text-[#bfa15f] uppercase tracking-wider truncate">
              {ROLE_LABELS[user?.roleName] || user?.roleName}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#bfa15f] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-2 space-y-1 shrink-0">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white"
          title={collapsed ? 'Trang chủ' : undefined}
        >
          <Home size={18} />
          {!collapsed && <span>Trang chủ</span>}
        </NavLink>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-500/10"
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 text-white/40 hover:text-white/70 text-xs"
        >
          {collapsed ? '»' : '« Thu gọn'}
        </button>
      </div>
    </aside>
  );
}

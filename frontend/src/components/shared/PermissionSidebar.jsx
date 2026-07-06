/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║      HMS LUXURY — PERMISSION-BASED SIDEBAR NAVIGATION           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * CÁCH HOẠT ĐỘNG:
 * 1. `useAuth()` lấy `user.permissions: string[]` từ AuthContext.
 * 2. `useMemo` chạy `filterMenuByPermissions()` — tạo danh sách menu
 *    đã lọc. Chỉ re-compute khi `user.permissions` thay đổi.
 * 3. `groupedMenu` nhóm các item theo `group` key để render header.
 * 4. `NavLink` tự động áp `isActive` class khi URL khớp với `path`.
 * 5. Sidebar hỗ trợ collapsible (co giãn) với animation mượt mà.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Crown, LogOut, Home, ChevronLeft, ChevronRight,
  Menu, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { MENU_CONFIG, GROUP_LABELS, filterMenuByPermissions } from '../../config/menuConfig';
// NOTE: filterMenuByPermissions now supports the `permissions: string[]` array format
// and `alwaysVisible: true` items (Account, Password).

// ─── Utility: group array by a key ──────────────────────────────────────────
function groupBy(array, keyFn) {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// ─── Sub-component: Single nav item ─────────────────────────────────────────
function NavItem({ item, collapsed, locale, onClick }) {
  const ItemIcon = item.icon;
  const label = locale === 'vi' ? item.label : item.labelEn;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
         transition-all duration-200 ease-in-out
         ${isActive
           ? 'bg-[#bfa15f] text-white shadow-lg shadow-[#bfa15f]/25'
           : 'text-white/65 hover:text-white hover:bg-white/8'
         }
         ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full" />
          )}

          {/* Icon */}
          <ItemIcon
            size={18}
            className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#bfa15f]'}`}
          />

          {/* Label — hidden when collapsed */}
          {!collapsed && (
            <span className="truncate leading-tight">{label}</span>
          )}

          {/* Tooltip on hover when collapsed */}
          {collapsed && (
            <span className="
              pointer-events-none absolute left-full ml-3 z-[999]
              bg-[#0c192c] border border-white/10 text-white text-xs font-semibold
              px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl
              opacity-0 group-hover:opacity-100
              translate-x-1 group-hover:translate-x-0
              transition-all duration-200
            ">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sub-component: Section group header ────────────────────────────────────
function GroupHeader({ groupKey, collapsed, locale }) {
  if (collapsed) {
    return <div className="h-px bg-white/8 my-2 mx-2" />;
  }
  const groupLabel = GROUP_LABELS[groupKey];
  const label = locale === 'vi' ? groupLabel?.vi : groupLabel?.en;

  return (
    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] px-3 pt-4 pb-1.5 first:pt-0">
      {label}
    </p>
  );
}

// ─── Sub-component: User profile section ────────────────────────────────────
function UserProfile({ user, collapsed, onLogout }) {
  const [open, setOpen] = useState(false);
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? user?.fullName : undefined}
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-[#bfa15f] to-[#a88a4a] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm ring-2 ring-white/10">
          {initial}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[10px] text-[#bfa15f] font-medium truncate">
                {user?.roleName}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-white/40 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)} />
          <div className={`
            absolute bottom-full mb-2 z-[999]
            bg-[#1a2d45] border border-white/10 rounded-xl shadow-2xl
            min-w-[180px] py-1.5 overflow-hidden
            ${collapsed ? 'left-full ml-3' : 'left-0 right-0'}
          `}>
            {/* User info header */}
            <div className="px-4 py-2 border-b border-white/10 mb-1">
              <p className="text-xs font-bold text-white">{user?.fullName}</p>
              <p className="text-[10px] text-white/50 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT: PermissionSidebar ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
/**
 * @param {Object}   props
 * @param {boolean}  [props.mobileOpen]    - Mobile overlay open state (controlled by parent)
 * @param {Function} [props.onMobileClose] - Callback to close mobile overlay
 */
export default function PermissionSidebar({ mobileOpen = false, onMobileClose }) {
  const { user, logout } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();

  // ── Collapsible state (desktop only) ──
  const [collapsed, setCollapsed] = useState(false);

  // ── STEP 1: Filter menu by user permissions ──────────────────────────────
  // useMemo ensures this only re-runs when user.permissions array changes.
  const visibleMenu = useMemo(
    () => filterMenuByPermissions(user?.permissions ?? [], user?.roleName),
    [user?.permissions, user?.roleName]
  );

  // ── STEP 2: Group visible menu items by their `group` property ───────────
  // Result: { overview: [...], system: [...], operations: [...] }
  const groupedMenu = useMemo(
    () => groupBy(visibleMenu, (item) => item.group ?? 'other'),
    [visibleMenu]
  );

  // Preserve group order from MENU_CONFIG (not arbitrary object key order)
  const groupOrder = useMemo(
    () => [...new Set(MENU_CONFIG.map((i) => i.group).filter(Boolean))],
    []
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleNavClick = useCallback(() => {
    if (onMobileClose) onMobileClose();
  }, [onMobileClose]);

  // ── Sidebar width ─────────────────────────────────────────────────────────
  const sidebarW = collapsed ? 'w-[68px]' : 'w-64';

  return (
    <>
      {/* ── Mobile overlay backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR PANEL
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-gradient-to-b from-[#0c192c] via-[#0f1e30] to-[#0a1520]
          border-r border-white/[0.06]
          shadow-2xl shadow-black/40
          transition-all duration-300 ease-in-out

          /* Desktop: always visible, collapsible */
          lg:translate-x-0 ${sidebarW}

          /* Mobile: slide in/out */
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'}
          lg:${collapsed ? 'w-[68px]' : 'w-64'}
        `}
      >
        {/* ── Brand Header ──────────────────────────────────────────────── */}
        <div className={`
          flex items-center border-b border-white/[0.08] shrink-0
          h-[60px] transition-all duration-300
          ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}
        `}>
          {/* Logo + name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity min-w-0"
            onClick={handleNavClick}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#bfa15f] to-[#a88a4a] rounded-lg flex items-center justify-center shrink-0 shadow-lg">
              <Crown size={16} className="text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight tracking-wide">
                  HMS <span className="text-[#bfa15f]">Luxury</span>
                </p>
                <p className="text-[8px] uppercase tracking-[0.25em] text-white/40">Hotel & Resort</p>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 scrollbar-thin">
          {visibleMenu.length === 0 ? (
            /* Empty state — no permissions assigned */
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Menu size={18} className="text-white/30" />
              </div>
              {!collapsed && (
                <p className="text-xs text-white/30 leading-relaxed">
                  Chưa có quyền truy cập.<br />Liên hệ quản trị viên.
                </p>
              )}
            </div>
          ) : (
            /* Render grouped menu */
            groupOrder.map((groupKey) => {
              const items = groupedMenu[groupKey];
              if (!items?.length) return null;

              return (
                <div key={groupKey}>
                  {/* Group section header */}
                  <GroupHeader groupKey={groupKey} collapsed={collapsed} locale={locale} />

                  {/* Menu items in this group */}
                  {items.map((item) => (
                    <NavItem
                      key={item.key}
                      item={item}
                      collapsed={collapsed}
                      locale={locale}
                      onClick={handleNavClick}
                    />
                  ))}
                </div>
              );
            })
          )}
        </nav>

        {/* ── Footer: Home + User Profile ───────────────────────────────── */}
        <div className="border-t border-white/[0.08] p-2 space-y-1 shrink-0">
          {/* Back to home */}
          <Link
            to="/"
            onClick={handleNavClick}
            title={collapsed ? 'Trang chủ' : undefined}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-xl
              text-white/50 hover:text-white hover:bg-white/8
              text-xs font-semibold transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <Home size={16} className="text-[#bfa15f] shrink-0" />
            {!collapsed && <span>Trang Chủ</span>}
          </Link>

          {/* User profile with dropdown */}
          <UserProfile user={user} collapsed={collapsed} onLogout={handleLogout} />
        </div>

        {/* ── Collapse toggle button (desktop only) ─────────────────────── */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            hidden lg:flex absolute -right-3 top-[72px]
            w-6 h-6 items-center justify-center
            bg-[#1a2d45] border border-white/15 rounded-full
            text-white/60 hover:text-white hover:bg-[#243a54]
            shadow-lg transition-all duration-200 hover:scale-110
          `}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed
            ? <ChevronRight size={12} />
            : <ChevronLeft size={12} />
          }
        </button>
      </aside>
    </>
  );
}

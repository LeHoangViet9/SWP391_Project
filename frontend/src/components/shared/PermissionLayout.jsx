/**
 * PermissionLayout — Shell layout dùng PermissionSidebar.
 *
 * Dùng thay thế cho DashboardLayout ở các trang cần sidebar
 * tự động hiện/ẩn menu theo quyền hạn (permission-based).
 *
 * Usage:
 *   <PermissionLayout title="Báo Cáo" subtitle="...">
 *     <YourPageContent />
 *   </PermissionLayout>
 */

import React, { useState } from 'react';
import { Menu, ShieldAlert, ChevronDown } from 'lucide-react';
import PermissionSidebar from './PermissionSidebar';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useNavigate } from 'react-router-dom';

export default function PermissionLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Permission-based Sidebar ─────────────────────────────────── */}
      <PermissionSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main content area ────────────────────────────────────────── */}
      {/* lg:pl-64 accounts for sidebar width; when collapsed it's pl-[68px] but sidebar manages its own width */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300">

        {/* ── Top Header ───────────────────────────────────────────────── */}
        <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-stone-100 transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb area badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-stone-100 px-3 py-1.5 rounded-lg">
            <ShieldAlert size={13} className="text-[#bfa15f]" />
            <span className="font-medium">HMS Admin Area</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Language toggle */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setUserMenuOpen(false); }}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-slate-700 hover:border-[#bfa15f] transition-colors"
              >
                {locale === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
                <ChevronDown size={11} className="text-slate-400" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-[50]" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-[60] overflow-hidden text-xs min-w-[110px]">
                    <button
                      onClick={() => { setLocale('vi'); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-stone-50 font-medium ${locale === 'vi' ? 'text-[#bfa15f]' : 'text-slate-700'}`}
                    >
                      🇻🇳 Tiếng Việt
                    </button>
                    <button
                      onClick={() => { setLocale('en'); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-stone-50 font-medium ${locale === 'en' ? 'text-[#bfa15f]' : 'text-slate-700'}`}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                </>
              )}
            </div>

            <span className="w-px h-5 bg-stone-200" />

            {/* User quick info */}
            <div className="relative">
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setLangOpen(false); }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-[#bfa15f] to-[#a88a4a] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-400">{user?.roleName}</p>
                </div>
                <ChevronDown size={13} className="text-slate-400 hidden md:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[50]" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl z-[60] min-w-[180px] py-1.5 overflow-hidden text-xs">
                    <div className="px-4 py-2 border-b border-stone-100 mb-1">
                      <p className="font-bold text-slate-800">{user?.fullName}</p>
                      <p className="text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="w-full text-left px-4 py-2 text-red-500 font-semibold hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────── */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          {/* Page title */}
          {(title || subtitle) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
          )}

          {/* Content slot */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

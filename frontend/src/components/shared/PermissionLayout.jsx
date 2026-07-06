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

import React, { useEffect, useState } from 'react';
import { Bell, ChevronDown, Menu, ShieldAlert } from 'lucide-react';
import PermissionSidebar from './PermissionSidebar';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';

export default function PermissionLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadNotifications = async () => {
    if (!user?.id) return;
    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications(10, locale),
        notificationService.getUnreadCount(locale),
      ]);
      setNotifications(Array.isArray(listRes?.data) ? listRes.data : []);
      setUnreadCount(Number(countRes?.data?.count || 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, [user?.id, locale]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await notificationService.markNotificationRead(notification.id, locale);
      }
    } catch {
      // Navigation should still work even if marking read fails.
    } finally {
      setNotificationOpen(false);
      setUnreadCount((count) => Math.max(0, count - (notification.read ? 0 : 1)));
      setNotifications((items) => items.map((item) => (
        item.id === notification.id ? { ...item, read: true } : item
      )));
      navigate(notification.targetUrl || '/dashboard/housekeeping');
    }
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
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setLangOpen(false);
                  setUserMenuOpen(false);
                }}
                className="relative w-9 h-9 flex items-center justify-center border border-stone-200 rounded-lg text-slate-600 hover:border-[#bfa15f] hover:text-[#bfa15f] transition-colors"
                aria-label="Notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] font-bold text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <>
                  <div className="fixed inset-0 z-[50]" onClick={() => setNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl z-[60] w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">Thông báo</p>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-bold text-red-500">{unreadCount} mới</span>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-400">
                          Chưa có thông báo
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full text-left px-4 py-3 border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors ${item.read ? 'bg-white' : 'bg-amber-50/70'}`}
                          >
                            <div className="flex items-start gap-2">
                              {!item.read && <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800">{item.title}</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.message}</p>
                                {item.createdAt && (
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    {new Date(item.createdAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Language toggle */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setUserMenuOpen(false); setNotificationOpen(false); }}
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
                onClick={() => { setUserMenuOpen(!userMenuOpen); setLangOpen(false); setNotificationOpen(false); }}
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

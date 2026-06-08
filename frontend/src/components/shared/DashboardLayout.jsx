import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, LogOut, Home, ChevronDown, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';

export default function DashboardLayout({ title, subtitle, tabs, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const active = tabs.find(t => t.key === activeTab);
  const hasAccountTab = tabs.some(t => t.key === 'account');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLocale = (lang) => {
    setLocale(lang);
    setLangOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0c192c] text-white flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#bfa15f] rounded flex items-center justify-center">
              <Crown className="text-white" size={20} />
            </div>
            <div>
              <p className="font-display text-base font-bold text-white leading-tight">
                HMS Luxury
              </p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#bfa15f]">
                Hotel & Resort
              </p>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-3 mb-2">
            {t('dashboard.menu')}
          </p>
          {tabs.map(({ key, label, Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#bfa15f] text-white shadow-lg shadow-[#bfa15f]/20'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-[#bfa15f]'} />
                <span>{t(`dashboard.tabs.${key}`) || label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-1 shrink-0">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Home size={18} className="text-[#bfa15f]" />
            <span>{t('dashboard.backHome')}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm shrink-0">
          {/* Left: Mobile Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-stone-100"
          >
            <Menu size={20} />
          </button>

          {/* Center/Search Placeholder */}
          <div className="hidden sm:flex items-center text-xs text-slate-400 gap-1 bg-stone-100 px-3 py-1.5 rounded-md">
            <ShieldAlert size={14} className="text-[#bfa15f]" />
            <span>{t('dashboard.adminArea')}</span>
          </div>

          {/* Right: Lang & User Dropdown */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-stone-200 rounded text-xs hover:border-[#bfa15f] transition-colors bg-white font-semibold text-slate-700"
              >
                <span>{locale === 'vi' ? 'VI' : 'EN'}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1.5 bg-white text-slate-800 rounded shadow-lg overflow-hidden min-w-[110px] z-[60] border border-stone-200 text-xs">
                  <button
                    onClick={() => toggleLocale('vi')}
                    className={`block w-full text-left px-4 py-2 hover:bg-stone-100 ${locale === 'vi' ? 'text-[#bfa15f] font-semibold' : ''}`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => toggleLocale('en')}
                    className={`block w-full text-left px-4 py-2 hover:bg-stone-100 ${locale === 'en' ? 'text-[#bfa15f] font-semibold' : ''}`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <span className="w-px h-6 bg-stone-200" />

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-[#bfa15f] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{user?.roleName}</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 bg-white border border-stone-200 shadow-xl rounded-lg min-w-[180px] py-1.5 z-[60] text-xs">
                  <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                    {t('dashboard.account')}
                  </p>
                  {hasAccountTab && (
                    <button
                      onClick={() => {
                        setActiveTab('account');
                        setUserOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-50 text-slate-700 font-medium transition-colors"
                    >
                      {t('dashboard.viewAccount')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab('password');
                      setUserOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-stone-50 text-slate-700 font-medium transition-colors"
                  >
                    {t('dashboard.changePassword')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-semibold transition-colors border-t border-stone-100 mt-1"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Breadcrumb / Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-800 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Tab content panel */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2 border-b border-stone-100 pb-3">
              {active && <active.Icon size={18} className="text-[#bfa15f]" />}
              {t(`dashboard.tabs.${active?.key}`) || active?.label}
              {activeTab === 'room-types' && tabs.find(t => t.key === 'room-types')?.readOnly && (
                <span className="text-xs text-slate-400 font-normal ml-2">
                  {locale === 'vi' ? '(Chỉ xem)' : '(Read only)'}
                </span>
              )}
            </h2>
            {active?.component}
          </div>
        </main>
      </div>
    </div>
  );
}

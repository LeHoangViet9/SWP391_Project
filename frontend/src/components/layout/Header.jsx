import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Menu,
  X,
  User,
  Crown,
  LogOut,
} from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { getDefaultDashboardPath, isStaffRole } from '../../utils/roleAccess';

const NAV_ITEMS = [
  { key: 'nav.home', href: '#home' },
  { key: 'nav.hotels', href: '#hotels' },
  { key: 'nav.roomTypes', href: '#room-types' },
  { key: 'nav.promotions', href: '#promotions' },
  { key: 'nav.amenities', href: '#amenities' },
  { key: 'nav.news', href: '#news' },
];

export default function Header() {
  const { locale, setLocale, t } = useLocale();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const toggleLocale = (lang) => {
    setLocale(lang);
    setLangOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Bar */}
      <div className="bg-royal-dark text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <a href="tel:19001838" className="flex items-center gap-1.5 hover:text-[#bfa15f] transition-colors">
              <Phone size={14} className="text-[#bfa15f]" />
              <span className="hidden sm:inline">{t('hotline')}:</span>
              <strong>1900 1838</strong>
            </a>
            <a href="mailto:contact@hms-luxury.vn" className="hidden md:flex items-center gap-1.5 hover:text-[#bfa15f] transition-colors">
              <Mail size={14} className="text-[#bfa15f]" />
              contact@hms-luxury.vn
            </a>
            <span className="hidden lg:flex items-center gap-1.5">
              <MapPin size={14} className="text-[#bfa15f]" />
              {t('branches')}: 63+
            </span>
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 px-3 py-1 border border-[#bfa15f]/40 rounded hover:border-[#bfa15f] transition-colors"
            >
              <span className={locale === 'vi' ? 'text-[#bfa15f] font-semibold' : 'text-white/60'}>VI</span>
              <span className="text-white/40">|</span>
              <span className={locale === 'en' ? 'text-[#bfa15f] font-semibold' : 'text-white/60'}>EN</span>
              <ChevronDown size={14} className="ml-1" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 bg-white text-slate-800 rounded shadow-lg overflow-hidden min-w-[120px]">
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
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="#home" className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#bfa15f] rounded flex items-center justify-center">
                <Crown className="text-white" size={24} />
              </div>
              <div className="hidden sm:block">
                <p className="font-display text-lg md:text-xl font-bold text-slate-800 leading-tight">
                  HMS Luxury
                </p>
                <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-[#bfa15f]">
                  Hotel & Resort
                </p>
              </div>
            </a>

            {/* Desktop Menu */}
            <ul className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#bfa15f] transition-colors uppercase tracking-wide"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserOpen(!userOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-[#bfa15f] transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#bfa15f] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="max-w-[120px] truncate">{user?.fullName}</span>
                    <ChevronDown size={14} />
                  </button>
                  {userOpen && (
                    <div className="absolute right-0 mt-1 bg-white border border-stone-200 shadow-lg rounded min-w-[180px] py-1 z-50">
                      <p className="px-4 py-2 text-xs text-slate-400 border-b border-stone-100">
                        {user?.roleName}
                      </p>
                      {isStaffRole(user?.roleName) && (
                        <Link
                          to={getDefaultDashboardPath(user?.roleName)}
                          onClick={() => setUserOpen(false)}
                          className="block px-4 py-2 text-sm text-[#bfa15f] hover:bg-stone-50 font-medium"
                        >
                          Bảng điều khiển
                        </Link>
                      )}
                      <button
                        onClick={() => { logout(); setUserOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} />
                        {t('auth.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-[#bfa15f] transition-colors"
                  >
                    <User size={16} />
                    {t('auth.login')}
                  </Link>
                  <Link to="/register" className="btn-gold px-5 py-2.5 text-sm rounded">
                    {t('auth.register')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden p-2 text-slate-700"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#bfa15f] font-medium"
              >
                {t(item.key)}
              </a>
            ))}
            <div className="pt-3 border-t border-stone-200">
              {isAuthenticated ? (
                <button onClick={logout} className="w-full py-2 text-red-600 text-sm font-medium">
                  {t('auth.logout')} ({user?.fullName})
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1 text-center py-2 border border-[#bfa15f] text-[#bfa15f] rounded text-sm font-medium">
                    {t('auth.login')}
                  </Link>
                  <Link to="/register" className="flex-1 text-center py-2 btn-gold rounded text-sm">
                    {t('auth.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

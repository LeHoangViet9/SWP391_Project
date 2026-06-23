import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export default function AuthLayout({ children, title, subtitle }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-royal-dark overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"
          alt="Luxury Hotel"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-royal-dark/90 to-[#bfa15f]/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-[#bfa15f] rounded flex items-center justify-center">
              <Crown size={24} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">HMS Luxury</p>
              <p className="text-xs uppercase tracking-[0.3em] text-[#cda152]">Hotel & Resort</p>
            </div>
          </Link>
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight mb-4">
              {locale === 'vi'
                ? 'Chào mừng đến với\nđẳng cấp 5 sao'
                : 'Welcome to\n5-Star Luxury'}
            </h2>
            <p className="text-white/70 max-w-md">
              {locale === 'vi'
                ? 'Đăng nhập để đặt phòng, quản lý đơn đặt và tận hưởng ưu đãi độc quyền.'
                : 'Sign in to book rooms, manage reservations and enjoy exclusive offers.'}
            </p>
          </div>
          <p className="text-white/40 text-sm">© 2026 HMS Luxury Hotel</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-stone-50">
        <div className="flex items-center justify-between p-4 md:p-6">
          <Link to="/" className="text-sm text-slate-500 hover:text-[#bfa15f] transition-colors">
            ← {locale === 'vi' ? 'Trang chủ' : 'Home'}
          </Link>
          <div className="flex gap-1 text-sm">
            <button
              onClick={() => setLocale('vi')}
              className={locale === 'vi' ? 'text-[#bfa15f] font-semibold' : 'text-slate-400'}
            >
              VI
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setLocale('en')}
              className={locale === 'en' ? 'text-[#bfa15f] font-semibold' : 'text-slate-400'}
            >
              EN
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">{title}</h1>
              {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

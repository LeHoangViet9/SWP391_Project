import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { getDefaultDashboardPath } from '../utils/roleAccess';

export default function Page404() {
  const { t } = useLocale();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #ece9e0 100%)' }}>
      <div className="text-center max-w-lg animate-fadeInUp">
        {/* Big 404 */}
        <div className="error-code select-none mb-4">404</div>

        {/* Floating icon */}
        <div className="inline-flex p-4 bg-[#bfa15f]/10 rounded-2xl mb-6 animate-float">
          <MapPin className="text-[#bfa15f]" size={36} />
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 mb-3">
          {t('staff.page404.title')}
        </h1>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          {t('staff.page404.desc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-2.5 border border-stone-200 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            {t('staff.page404.backHome')}
          </Link>
          {user && (
            <Link
              to={getDefaultDashboardPath(user.roleName)}
              className="btn-gold px-6 py-2.5 rounded-lg text-sm"
            >
              {t('staff.page404.backDashboard')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { getDefaultDashboardPath } from '../utils/roleAccess';

export default function UnauthorizedPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const location = useLocation();
  const attemptedPath = location.state?.from || '';

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #ece9e0 100%)' }}>
      <div className="text-center max-w-lg animate-fadeInUp">
        {/* Big 403 */}
        <div className="error-code select-none mb-4">403</div>

        {/* Shield icon */}
        <div className="inline-flex p-4 bg-red-50 rounded-2xl mb-6 animate-float">
          <ShieldX className="text-red-500" size={36} />
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-800 mb-3">
          {t('staff.unauthorized.title')}
        </h1>
        <p className="text-slate-500 mb-2">
          {t('staff.unauthorized.desc')}
        </p>
        {attemptedPath && (
          <p className="text-xs text-slate-400 mb-8 font-mono bg-stone-100 inline-block px-3 py-1 rounded-full">
            {attemptedPath}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            to="/"
            className="px-6 py-2.5 border border-stone-200 rounded-lg text-sm font-medium hover:bg-white transition-colors inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            {t('bookingPage.backHome')}
          </Link>
          {user && (
            <Link
              to={getDefaultDashboardPath(user.roleName)}
              className="btn-gold px-6 py-2.5 rounded-lg text-sm"
            >
              {t('staff.nav.dashboard')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

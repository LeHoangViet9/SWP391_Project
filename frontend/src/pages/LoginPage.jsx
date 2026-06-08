import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { getDefaultDashboardPath, isStaffRole } from '../utils/roleAccess';

export default function LoginPage() {
  const { t } = useLocale();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      const role = res?.data?.roleName;
      const staffPaths = ['/admin/', '/receptionist/', '/housekeeper/', '/maintenance/'];
      const isStaffRedirect = staffPaths.some((p) => redirect.startsWith(p));
      if (isStaffRedirect && isStaffRole(role)) {
        navigate(redirect);
      } else if (isStaffRole(role)) {
        navigate(getDefaultDashboardPath(role));
      } else {
        navigate(isStaffRedirect ? '/' : redirect);
      }
    } catch (err) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.login')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('auth.username')}
          </label>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors"
            placeholder={t('auth.usernamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-stone-300 px-4 py-3 pr-12 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end text-sm">
          <Link
            to="/forgot-password"
            className="text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <LogIn size={18} />
          {loading ? '...' : t('auth.login')}
        </button>

        <p className="text-center text-sm text-slate-500">
          {t('auth.noAccount')}{' '}
          <Link
            to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-[#bfa15f] font-semibold hover:underline"
          >
            {t('auth.register')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

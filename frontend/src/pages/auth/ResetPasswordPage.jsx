import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { useLocale } from '../../context/LocaleContext';
import { resetPassword } from '../../services/authService';

export default function ResetPasswordPage() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [form, setForm] = useState({
    token: tokenFromUrl,
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError(t('auth.errPasswordMatch'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(form, locale);
      navigate('/login', { state: { message: t('staff.auth.resetSuccess') } });
    } catch (err) {
      setError(err.message || t('staff.auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('staff.auth.resetTitle')} subtitle={t('staff.auth.resetSubtitle')}>
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            Token
          </label>
          <input
            type="text"
            required
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
            className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('staff.auth.newPassword')}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              minLength={6}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full border border-stone-300 px-4 py-3 pr-12 outline-none focus:border-[#bfa15f]"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('auth.rePassword')}
          </label>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full border border-stone-300 px-4 py-3 outline-none focus:border-[#bfa15f]"
          />
        </div>
        <button type="submit" disabled={loading} className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60">
          <KeyRound size={18} />
          {loading ? '...' : t('staff.auth.resetPassword')}
        </button>
        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="text-[#bfa15f] font-semibold hover:underline">
            {t('staff.auth.backToLogin')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

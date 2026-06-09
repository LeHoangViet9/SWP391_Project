import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { useLocale } from '../../context/LocaleContext';
import { forgotPassword } from '../../services/authService';

export default function ForgotPasswordPage() {
  const { t, locale } = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email, locale);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('staff.auth.forgotFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('staff.auth.forgotTitle')} subtitle={t('staff.auth.forgotSubtitle')}>
      {success ? (
        <div className="bg-white border border-stone-200 shadow-lg p-8 text-center space-y-4">
          <div className="inline-flex p-3 bg-emerald-100 rounded-full">
            <Mail className="text-emerald-600" size={24} />
          </div>
          <p className="text-slate-600 text-sm">{t('staff.auth.forgotSuccess')}</p>
          <Link to="/login" className="inline-block text-[#bfa15f] font-semibold text-sm hover:underline">
            {t('staff.auth.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f]"
              placeholder="email@example.com"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full btn-gold py-3.5 rounded disabled:opacity-60">
            {loading ? '...' : t('staff.auth.sendResetLink')}
          </button>
          <p className="text-center text-sm text-slate-500">
            <Link to="/login" className="text-[#bfa15f] font-semibold hover:underline">
              {t('staff.auth.backToLogin')}
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

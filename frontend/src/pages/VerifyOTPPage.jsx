import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { activeAccount } from '../services/authService';

export default function VerifyOTPPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length < 6) {
      setError(t('auth.errOtpLength') || 'OTP code must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await activeAccount({ email, otp });
      setSuccess(res.message || t('auth.activeSuccess') || 'Account activated successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || t('auth.activeFailed') || 'OTP code is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-stone-300 px-4 py-3 text-slate-800 text-center text-2xl tracking-widest outline-none focus:border-[#bfa15f] transition-colors';
  const labelClass = 'block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2 text-center';

  return (
    <AuthLayout title={t('auth.verifyEmail') || 'Email Verification'} subtitle={t('auth.verifySubtitle') || 'Please enter the OTP code sent to your email'}>
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-6">
        <div className="text-center mb-4">
          <p className="text-sm text-slate-600">
            {t('auth.otpSentTo') || 'OTP code sent to:'} <br />
            <span className="font-semibold text-slate-800">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded">{success}</div>
        )}

        <div>
          <label className={labelClass}>{t('auth.otpCode') || 'OTP Code'}</label>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className={inputClass}
            placeholder="000000"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <CheckCircle size={18} />
          {loading ? '...' : t('auth.verify') || 'Confirm'}
        </button>

        <p className="text-center text-sm text-slate-500">
          {t('auth.noOtp') || 'Didn't receive code?'}{' '}
          <button type="button" onClick={() => window.location.reload()} className="text-[#bfa15f] font-semibold hover:underline">
            {t('auth.resendOtp') || 'Resend'}
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

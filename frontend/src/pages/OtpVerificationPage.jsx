import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { verifyOtp, resendOtp } from '../services/authService';

export default function OtpVerificationPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, email, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    if (otp.length !== 6) {
      setError(t('auth.errOtpLength') || 'Mã OTP phải có 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp({ email, otpCode: otp });
      setSuccess(res.message || 'Xác thực thành công!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setSuccess('');
    setResending(true);
    try {
      const res = await resendOtp(email);
      setSuccess(res.message || 'Gửi lại mã thành công! Vui lòng kiểm tra email.');
      setTimer(60);
    } catch (err) {
      setError(err.message || 'Gửi lại mã thất bại');
    } finally {
      setResending(false);
    }
  };

  const inputClass =
    'w-full border border-stone-300 px-4 py-3 text-center text-2xl tracking-[1rem] font-bold text-slate-800 outline-none focus:border-[#bfa15f] transition-colors';

  const labelClass =
    'block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2 text-center';

  return (
    <AuthLayout title="Xác thực OTP" subtitle={`Mã đã được gửi đến ${email}`}>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-stone-200 shadow-lg p-8 space-y-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded text-center">
            {success}
          </div>
        )}

        <div>
          <label className={labelClass}>Nhập mã 6 chữ số</label>
          <input
            type="text"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className={inputClass}
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <ShieldCheck size={18} />
          {loading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">Không nhận được mã?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className="text-[#bfa15f] font-semibold flex items-center justify-center gap-2 mx-auto hover:underline disabled:text-slate-300 disabled:no-underline"
          >
            {resending ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {timer > 0 ? `Gửi lại mã (${timer}s)` : 'Gửi lại mã ngay'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

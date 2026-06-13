import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, ShieldCheck, RefreshCcw } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';

const PHONE_RE = /^(0|\+84)[0-9]{9}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&+=!]{6,}$/;

export default function RegisterPage() {
  const { t } = useLocale();
  const { register, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/login';

  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    rePassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showRePass, setShowRePass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = () => setTimer(300); // 5 minutes

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!USERNAME_RE.test(form.userName)) return t('auth.errUsername');
    if (!PASSWORD_RE.test(form.password)) return t('auth.errPassword');
    if (form.password !== form.rePassword) return t('auth.errPasswordMatch');
    if (!PHONE_RE.test(form.phone)) return t('auth.errPhone');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await register(form);
      setSuccess('Đăng ký thành công! Vui lòng nhập mã OTP đã được gửi đến email của bạn.');
      setShowOtpModal(true);
      startTimer();
    } catch (err) {
      setError(err.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setOtpLoading(true);
    try {
      await resendOtp(form.email);
      setSuccess('Mã OTP mới đã được gửi thành công.');
      startTimer();
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setError('');
    try {
      await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, otp }),
      });
      setSuccess('Xác thực OTP thành công! Đang chuyển hướng...');
      setTimeout(() => navigate(redirect), 1500);
    } catch (err) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setOtpLoading(false);
    }
  };

  const inputClass =
    'w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors';
  const labelClass = 'block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2';

  return (
    <AuthLayout title={t('auth.register')} subtitle={t('auth.registerSubtitle')}>
      {!showOtpModal ? (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded">{success}</div>
          )}

          <div>
            <label className={labelClass}>{t('auth.fullName')}</label>
            <input type="text" required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('auth.username')}</label>
            <input type="text" required minLength={4} maxLength={50} value={form.userName} onChange={(e) => update('userName', e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} placeholder="example@gmail.com" />
            </div>
            <div>
              <label className={labelClass}>{t('auth.phone')}</label>
              <input type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} placeholder="0912345678" />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className={`${inputClass} pr-12`}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">{t('auth.passwordHint')}</p>
          </div>

          <div>
            <label className={labelClass}>{t('auth.rePassword')}</label>
            <div className="relative">
              <input
                  type={showRePass ? 'text' : 'password'}
                  required
                  value={form.rePassword}
                  onChange={(e) => update('rePassword', e.target.value)}
                  className={`${inputClass} pr-12`}
              />
              <button
                  type="button"
                  onClick={() => setShowRePass(!showRePass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showRePass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60">
            <UserPlus size={18} />
            {loading ? '...' : t('auth.register')}
          </button>

          <p className="text-center text-sm text-slate-500">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-[#bfa15f] font-semibold hover:underline">{t('auth.login')}</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="bg-white border border-stone-200 shadow-lg p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-[#bfa15f] mb-4">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Xác thực OTP</h3>
            <p className="text-sm text-slate-500 mt-1">Chúng tôi đã gửi mã OTP đến <strong>{form.email}</strong></p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded">{success}</div>
          )}

          <div className="flex justify-center gap-2">
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="w-full max-w-[200px] text-center text-2xl tracking-[0.5em] font-bold border-b-2 border-stone-300 py-2 outline-none focus:border-[#bfa15f] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={otpLoading}
            className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {otpLoading ? 'Đang xác thực...' : 'Xác nhận OTP'}
          </button>

          <div className="flex flex-col items-center gap-3 mt-4">
            {timer > 0 ? (
              <p className="text-sm text-slate-500">
                Gửi lại mã sau: <span className="font-bold text-[#bfa15f]">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="flex items-center gap-2 text-[#bfa15f] font-semibold hover:underline text-sm"
              >
                <RefreshCcw size={14} className={otpLoading ? 'animate-spin' : ''} />
                Gửi lại mã OTP
              </button>
            )}
          </div>

          <div className="text-center text-sm pt-2">
            <button
              type="button"
              onClick={() => {
                setShowOtpModal(false);
                setTimer(0);
              }}
              className="text-slate-500 hover:text-slate-800"
            >
              Quay lại đăng ký
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, RefreshCcw } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { getDefaultDashboardPath, isStaffRole } from '../utils/roleAccess';

export default function LoginPage() {
  const { t } = useLocale();
  const { login, verifyLogin, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [form, setForm] = useState({ username: '', password: '' });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(form);
      setSuccess('Mã OTP đã được gửi đến email của bạn.');
      setShowOtp(true);
      startTimer();
    } catch (err) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resendOtp(form.username);
      setSuccess('Mã OTP mới đã được gửi thành công.');
      startTimer();
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyLogin({ username: form.username, otp });
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
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.login')} subtitle={showOtp ? "Nhập mã xác thực để tiếp tục" : t('auth.loginSubtitle')}>
      <div className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded">
            {success}
          </div>
        )}

        {!showOtp ? (
          <form onSubmit={handleSubmit} className="space-y-5">
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
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2 text-center">
                Mã xác thực OTP
              </label>
              <input
                type="text"
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border-2 border-[#bfa15f]/30 px-4 py-4 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors text-center text-2xl font-bold tracking-[0.5em] rounded-lg bg-stone-50"
                placeholder="000000"
                maxLength={6}
              />
              <p className="text-center text-xs text-slate-400 mt-3">
                Vui lòng kiểm tra email để lấy mã bảo mật.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận Đăng nhập'}
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
                  disabled={loading}
                  className="flex items-center gap-2 text-[#bfa15f] font-semibold hover:underline text-sm"
                >
                  <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                  Gửi lại mã OTP
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowOtp(false);
                setTimer(0);
              }}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-800 pt-2"
            >
              Quay lại đăng nhập
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500">
          {t('auth.noAccount')}{' '}
          <Link
            to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-[#bfa15f] font-semibold hover:underline"
          >
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { t, locale } = useLocale();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Đọc email và flag registered từ URL (sau khi đăng ký xong)
  const emailFromUrl = searchParams.get('email') || '';

  const [form, setForm] = useState({ email: emailFromUrl, password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nếu URL thay đổi (ví dụ navigate lại trang login), cập nhật email
  useEffect(() => {
    if (emailFromUrl) {
      setForm((prev) => ({ ...prev, email: emailFromUrl }));
    }
  }, [emailFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate blank trước khi gửi
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();

    if (!trimmedEmail) {
      setError(locale === 'vi' ? 'Vui lòng nhập địa chỉ email.' : 'Please enter your email address.');
      return;
    }
    if (!trimmedPassword) {
      setError(locale === 'vi' ? 'Vui lòng nhập mật khẩu.' : 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email: trimmedEmail, password: trimmedPassword });
      // Điều hướng theo role sau khi đăng nhập thành công
      const role = res?.data?.roleName;
      if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (role === 'MANAGER') navigate('/manager/dashboard', { replace: true });
      else if (role === 'RECEPTIONIST') navigate('/receptionist/dashboard', { replace: true });
      else if (role === 'HOUSEKEEPER') navigate('/housekeeper/dashboard', { replace: true });
      else if (role === 'MAINTENANCE') navigate('/maintenance/dashboard', { replace: true });
      else if (role === 'CUSTOMER') navigate('/customer/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      // Nếu tài khoản cần xác thực OTP (khi đăng ký hoặc khi đăng nhập) → redirect sang trang verify
      const isOtpRequired =
        err.data?.errorCode === 'LOGIN_OTP_REQUIRED' ||
        err.data?.errorCode === 'ACCOUNT_PENDING' ||
        (err.message &&
          (err.message.toLowerCase().includes('pending') ||
            err.message.includes('xác thực') ||
            err.message.includes('verification') ||
            err.message.includes('otp')));
      if (isOtpRequired) {
        setError(err.message || (locale === 'vi' ? 'Cần xác thực mã OTP.' : 'OTP verification required.'));
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(trimmedEmail)}`);
        }, 1500);
      } else {
        setError(err.message || t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout title={t('auth.login')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">


        {/* Error message (with link to verify-otp if pending) */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
            <p>{error}</p>
            {(error.toLowerCase().includes('pending') ||
              error.includes('xác thực') ||
              error.includes('verification')) && (
              <Link
                to={`/verify-otp?email=${encodeURIComponent(form.email)}`}
                className="text-red-600 underline font-semibold text-xs mt-1 inline-block"
              >
                {locale === 'vi' ? '→ Đến trang xác thực OTP ngay' : '→ Go to OTP verification'}
              </Link>
            )}
          </div>
        )}

        {/* Email field — readonly nếu được pre-fill từ URL */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('auth.email')}
          </label>
          <input
            type="email"
            required
            value={form.email}
            readOnly={Boolean(emailFromUrl)}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`w-full border px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors ${
              emailFromUrl
                ? 'border-stone-200 bg-stone-50 text-slate-500 cursor-default'
                : 'border-stone-300'
            }`}
            placeholder={t('auth.emailPlaceholder')}
          />
          {emailFromUrl && (
            <button
              type="button"
              onClick={() => {
                setForm({ email: '', password: '' });
                navigate('/login', { replace: true });
              }}
              className="text-xs text-slate-400 hover:text-[#bfa15f] mt-1 underline"
            >
              {locale === 'vi' ? 'Dùng email khác' : 'Use a different email'}
            </button>
          )}
        </div>

        {/* Password field — auto-focus khi email đã được pre-fill */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              autoFocus={Boolean(emailFromUrl)}
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
            {locale === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
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
            to="/register"
            className="text-[#bfa15f] font-semibold hover:underline"
          >
            {t('auth.register')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

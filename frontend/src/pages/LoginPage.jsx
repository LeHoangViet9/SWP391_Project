import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, MailCheck } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';

/**
 * Trang Đăng nhập (LoginPage Component).
 * Cung cấp giao diện form đăng nhập và xử lý điều hướng người dùng dựa theo phân vai trò (Roles).
 */
export default function LoginPage() {
  const { t, locale } = useLocale();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Đọc email và flag registered từ URL (hoặc từ local storage sau khi quên MK)
  const emailFromUrl = searchParams.get('email') || localStorage.getItem('savedEmail') || '';
  const isJustRegistered = searchParams.get('registered') === '1';

  const [form, setForm] = useState({ email: emailFromUrl, password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Effect tự động điền lại email vào form khi email trong search parameters thay đổi
   * (phổ biến khi được chuyển tiếp từ trang Đăng ký thành công).
   */
  useEffect(() => {
    if (emailFromUrl) {
      setForm((prev) => ({ ...prev, email: emailFromUrl }));
      localStorage.removeItem('savedEmail'); // Xóa đi để không auto-fill mãi mãi
    }
  }, [emailFromUrl]);

  /**
   * Xử lý gửi form đăng nhập (Email & Mật khẩu).
   * Kiểm tra hợp lệ dữ liệu, gọi service đăng nhập, xử lý chuyển hướng dựa trên vai trò
   * hoặc chuyển hướng sang trang xác thực OTP nếu tài khoản đang ở trạng thái chờ kích hoạt (pending).
   *
   * @param {Event} e - Đối tượng sự kiện submit của form
   */
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
      if (role === 'ADMIN' || role === 'MANAGER') navigate('/admin/dashboard', { replace: true });
      else if (role === 'RECEPTIONIST') navigate('/receptionist/dashboard', { replace: true });
      else if (role === 'HOUSEKEEPER') navigate('/housekeeper/dashboard', { replace: true });
      else if (role === 'MAINTENANCE') navigate('/maintenance/dashboard', { replace: true });
      else if (role === 'CUSTOMER') navigate('/', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      // Nếu tài khoản chưa xác thực OTP → redirect sang trang verify
      const isPending =
        err.message &&
        (err.message.toLowerCase().includes('pending') ||
          err.message.includes('xác thực') ||
          err.message.includes('verification'));
      if (isPending) {
        setError(err.message);
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

        {/* Banner khi vừa đăng ký xong — nhắc nhập mật khẩu để đăng nhập */}
        {isJustRegistered && !error && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded flex items-start gap-2">
            <MailCheck size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">
                {locale === 'vi' ? 'Đăng ký thành công!' : 'Registration successful!'}
              </p>
              <p className="text-xs mt-0.5">
                {locale === 'vi'
                  ? 'Mã OTP đã gửi về email. Nhập mật khẩu để đăng nhập — sau đó bạn sẽ được yêu cầu xác thực OTP.'
                  : 'OTP was sent to your email. Enter your password to login — you will then be asked to verify OTP.'}
              </p>
            </div>
          </div>
        )}

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
            className={`w-full border px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors ${emailFromUrl
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

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { verifyOtp, resendOtp } from '../services/authService';

const RESEND_COOLDOWN = 60; // seconds

export default function OtpVerificationPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();

    // Guard: không có email từ URL
    if (!email) {
      setError(locale === 'vi' ? 'Không tìm thấy email. Vui lòng đăng ký lại.' : 'Email not found. Please register again.');
      return;
    }

    if (!otp.trim()) {
      setError(locale === 'vi' ? 'Vui lòng nhập mã xác thực.' : 'Please enter the verification code.');
      return;
    }
    if (otp.trim().length < 6) {
      setError(locale === 'vi' ? 'Mã xác thực phải đủ 6 chữ số.' : 'Verification code must be 6 digits.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyOtp({ email, otpCode: otp.trim() }, locale);
      setSuccess(
        locale === 'vi'
          ? 'Xác thực thành công! Đang chuyển về trang đăng nhập...'
          : 'Verified successfully! Redirecting to login...'
      );
      setTimeout(() => {
        navigate(`/login?email=${encodeURIComponent(email)}`, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || (locale === 'vi' ? 'Mã xác thực không hợp lệ.' : 'Invalid verification code.'));
    } finally {
      setLoading(false);
    }
  };


  const handleResend = useCallback(async () => {
    if (!canResend) return;

    // Guard: không có email
    if (!email) {
      setError(locale === 'vi' ? 'Không tìm thấy email. Vui lòng đăng ký lại.' : 'Email not found. Please register again.');
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');
    try {
      await resendOtp(email, locale);
      setSuccess(
        locale === 'vi'
          ? 'Mã xác thực mới đã được gửi về email của bạn.'
          : 'A new code has been sent to your email.'
      );
      setCanResend(false);
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.message || (locale === 'vi' ? 'Không thể gửi lại mã.' : 'Failed to resend code.'));
    } finally {
      setResending(false);
    }
  }, [canResend, email, locale]);

  const labelClass = 'block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2';
  const inputClass =
    'w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors tracking-[0.3em] text-center text-xl font-semibold';

  const title = locale === 'vi' ? 'Xác thực Email' : 'Email Verification';
  const subtitle =
    locale === 'vi'
      ? 'Nhập mã 6 chữ số đã được gửi tới email của bạn'
      : 'Enter the 6-digit code sent to your email';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <form onSubmit={handleVerify} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        {/* Email display — hoặc cảnh báo nếu không có email */}
        {email ? (
          <div className="bg-stone-50 border border-stone-200 rounded px-4 py-3 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              {locale === 'vi' ? 'Mã gửi tới' : 'Code sent to'}
            </p>
            <p className="text-sm font-semibold text-slate-700 truncate">{email}</p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded text-center">
            <p className="font-semibold mb-1">
              {locale === 'vi' ? '⚠️ Không tìm thấy email' : '⚠️ Email not found'}
            </p>
            <p className="text-xs">
              {locale === 'vi'
                ? 'Vui lòng quay lại và đăng ký để nhận mã xác thực.'
                : 'Please go back and register to receive a verification code.'}
            </p>
            <a href="/register" className="text-amber-700 underline font-semibold text-xs mt-1 inline-block">
              {locale === 'vi' ? '→ Đăng ký ngay' : '→ Register now'}
            </a>
          </div>
        )}


        {/* Alert messages */}
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

        {/* OTP Input */}
        <div>
          <label className={labelClass}>
            {locale === 'vi' ? 'Mã xác thực (6 chữ số)' : 'Verification Code (6 digits)'}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setOtp(v);
            }}
            className={inputClass}
            placeholder="000000"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-2 text-center">
            {locale === 'vi'
              ? 'Mã có hiệu lực trong 5 phút kể từ khi đăng ký.'
              : 'Code is valid for 5 minutes from registration.'}
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <ShieldCheck size={18} />
          {loading
            ? locale === 'vi' ? 'Đang xác thực...' : 'Verifying...'
            : locale === 'vi' ? 'Xác nhận mã' : 'Verify Code'}
        </button>

        {/* Resend OTP */}
        <div className="text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-[#bfa15f] font-semibold hover:underline flex items-center gap-1 mx-auto disabled:opacity-60"
            >
              <RotateCcw size={14} />
              {resending
                ? locale === 'vi' ? 'Đang gửi...' : 'Sending...'
                : locale === 'vi' ? 'Gửi lại mã' : 'Resend Code'}
            </button>
          ) : (
            <p className="text-sm text-slate-400">
              {locale === 'vi'
                ? `Gửi lại mã sau ${countdown}s`
                : `Resend code in ${countdown}s`}
            </p>
          )}
        </div>

        {/* Back to login */}
        <p className="text-center">
          <Link
            to="/login"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} />
            {locale === 'vi' ? 'Quay lại đăng nhập' : 'Back to Login'}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

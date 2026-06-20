import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { apiFetch } from '../services/api';
import { useLocale } from '../context/LocaleContext';

const RESEND_COOLDOWN = 30; // 30 seconds

export default function ForgotPasswordOtpPage() {
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

  const handleVerify = (e) => {
    e.preventDefault();

    if (!email) {
      setError(locale === 'vi' ? 'Không tìm thấy email. Vui lòng quay lại.' : 'Email not found. Please go back.');
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

    // Redirect to reset-password page with token
    navigate(`/reset-password?token=${encodeURIComponent(otp.trim())}`);
  };

  const handleResend = useCallback(async () => {
    if (!canResend) return;

    if (!email) {
      setError(locale === 'vi' ? 'Không tìm thấy email. Vui lòng quay lại.' : 'Email not found. Please go back.');
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
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

  const title = locale === 'vi' ? 'Xác thực Đặt lại Mật khẩu' : 'Reset Password Verification';
  const subtitle =
    locale === 'vi'
      ? 'Nhập mã OTP 6 chữ số đã được gửi tới email của bạn để tiếp tục đặt lại mật khẩu'
      : 'Enter the 6-digit OTP code sent to your email to continue resetting your password';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <form onSubmit={handleVerify} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        {/* Email display */}
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
            <a href="/forgot-password" className="text-amber-700 underline font-semibold text-xs mt-1 inline-block">
              {locale === 'vi' ? '→ Quay lại' : '→ Go back'}
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
            {locale === 'vi' ? 'Mã OTP (6 chữ số)' : 'OTP Code (6 digits)'}
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
              ? 'Mã có hiệu lực trong 15 phút kể từ khi gửi.'
              : 'Code is valid for 15 minutes from sending.'}
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <ShieldCheck size={18} />
          {locale === 'vi' ? 'Tiếp tục đặt lại mật khẩu' : 'Continue to reset password'}
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

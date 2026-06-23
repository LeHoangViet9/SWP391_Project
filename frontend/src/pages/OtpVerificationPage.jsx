import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ArrowLeft, CheckCircle2, UserPlus, Mail, Sparkles } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { useLocale } from '../context/LocaleContext';
import { verifyOtp, resendOtp } from '../services/authService';

const RESEND_COOLDOWN = 60; // seconds
const OTP_LENGTH = 6;

// Circular countdown timer component
function CircularTimer({ countdown, total }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = countdown / total;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={countdown > 10 ? '#bfa15f' : '#ef4444'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className={`absolute text-lg font-bold ${countdown > 10 ? 'text-slate-700' : 'text-red-500'}`}>
        {countdown}s
      </span>
    </div>
  );
}

// Progress stepper component
function ProgressStepper({ currentStep, locale }) {
  const steps = [
    { icon: UserPlus, label: locale === 'vi' ? 'Đăng ký' : 'Register' },
    { icon: Mail, label: locale === 'vi' ? 'Xác thực' : 'Verify' },
    { icon: CheckCircle2, label: locale === 'vi' ? 'Hoàn tất' : 'Done' },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = idx + 1 === currentStep;
        const isCompleted = idx + 1 < currentStep;

        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : isActive
                    ? 'bg-[#bfa15f] text-white shadow-lg shadow-[#bfa15f]/30 scale-110'
                    : 'bg-stone-200 text-slate-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : <StepIcon size={18} />}
              </div>
              <span className={`text-[10px] mt-1.5 font-semibold uppercase tracking-wider ${
                isActive ? 'text-[#bfa15f]' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 sm:w-16 h-0.5 mx-2 mb-5 transition-colors duration-500 ${
                isCompleted ? 'bg-emerald-400' : 'bg-stone-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OtpVerificationPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  // 6-digit OTP state
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [verifyStep, setVerifyStep] = useState(2); // 1=register, 2=verify, 3=done

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const otp = digits.join('');

  // Handle individual digit input
  const handleDigitChange = (index, value) => {
    // Only allow numeric input
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
    // Allow Enter to submit when all filled
    if (e.key === 'Enter' && otp.length === OTP_LENGTH) {
      handleVerify(e);
    }
  };

  // Handle paste (full OTP paste)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const newDigits = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((char, i) => {
        newDigits[i] = char;
      });
      setDigits(newDigits);
      // Focus the last filled or first empty
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email) {
      setError(locale === 'vi' ? 'Không tìm thấy email. Vui lòng đăng ký lại.' : 'Email not found. Please register again.');
      return;
    }

    if (otp.length < OTP_LENGTH) {
      setError(locale === 'vi' ? 'Vui lòng nhập đủ 6 chữ số.' : 'Please enter all 6 digits.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyOtp({ email, otpCode: otp.trim() }, locale);
      setVerifyStep(3);
      setSuccess(
        locale === 'vi'
          ? 'Xác thực thành công! Đang chuyển về trang đăng nhập...'
          : 'Verified successfully! Redirecting to login...'
      );
      setTimeout(() => {
        navigate(`/login?email=${encodeURIComponent(email)}`, { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || (locale === 'vi' ? 'Mã xác thực không hợp lệ.' : 'Invalid verification code.'));
      // Shake animation — clear digits
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!canResend) return;

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
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || (locale === 'vi' ? 'Không thể gửi lại mã.' : 'Failed to resend code.'));
    } finally {
      setResending(false);
    }
  }, [canResend, email, locale]);

  const title = locale === 'vi' ? 'Xác thực Email' : 'Email Verification';
  const subtitle =
    locale === 'vi'
      ? 'Nhập mã 6 chữ số đã được gửi tới email của bạn'
      : 'Enter the 6-digit code sent to your email';

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {/* Progress stepper */}
      <ProgressStepper currentStep={verifyStep} locale={locale} />

      <form onSubmit={handleVerify} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5 animate-fade-in">
        {/* Email display */}
        {email ? (
          <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              {locale === 'vi' ? 'Mã gửi tới' : 'Code sent to'}
            </p>
            <p className="text-sm font-semibold text-slate-700 truncate flex items-center justify-center gap-2">
              <Mail size={14} className="text-[#bfa15f]" />
              {email}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg text-center">
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
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg animate-shake">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            {success}
          </div>
        )}

        {/* 6-Digit OTP Input Boxes */}
        {verifyStep === 2 && (
          <>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-3 text-center">
                {locale === 'vi' ? 'Mã xác thực (6 chữ số)' : 'Verification Code (6 digits)'}
              </label>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-11 h-14 sm:w-13 sm:h-16 border-2 rounded-lg text-center text-xl sm:text-2xl font-bold outline-none transition-all duration-200
                      ${digit
                        ? 'border-[#bfa15f] bg-[#faf6ed] text-slate-800 shadow-sm'
                        : 'border-stone-300 bg-white text-slate-800 hover:border-stone-400'}
                      focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/20 focus:shadow-md`}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">
                {locale === 'vi'
                  ? 'Mã có hiệu lực trong 5 phút kể từ khi đăng ký.'
                  : 'Code is valid for 5 minutes from registration.'}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || otp.length < OTP_LENGTH}
              className="w-full btn-gold py-3.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-all duration-200 hover:shadow-lg hover:shadow-[#bfa15f]/20"
            >
              <ShieldCheck size={18} />
              {loading
                ? locale === 'vi' ? 'Đang xác thực...' : 'Verifying...'
                : locale === 'vi' ? 'Xác nhận mã' : 'Verify Code'}
            </button>

            {/* Resend OTP section with circular timer */}
            <div className="flex flex-col items-center gap-3 pt-2">
              {!canResend && (
                <CircularTimer countdown={countdown} total={RESEND_COOLDOWN} />
              )}
              
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-[#bfa15f] font-semibold hover:underline flex items-center gap-1.5 disabled:opacity-60 transition-all hover:gap-2"
                >
                  <RotateCcw size={14} className={resending ? 'animate-spin' : ''} />
                  {resending
                    ? locale === 'vi' ? 'Đang gửi...' : 'Sending...'
                    : locale === 'vi' ? 'Gửi lại mã xác thực' : 'Resend Verification Code'}
                </button>
              ) : (
                <p className="text-sm text-slate-400">
                  {locale === 'vi'
                    ? `Gửi lại mã sau ${countdown} giây`
                    : `Resend code in ${countdown} seconds`}
                </p>
              )}
            </div>
          </>
        )}

        {/* Success state — Step 3 */}
        {verifyStep === 3 && (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={36} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {locale === 'vi' ? 'Xác thực thành công!' : 'Verification Complete!'}
            </h3>
            <p className="text-sm text-slate-500">
              {locale === 'vi'
                ? 'Tài khoản đã được kích hoạt. Đang chuyển về trang đăng nhập...'
                : 'Your account is now active. Redirecting to login...'}
            </p>
            <div className="mt-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

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

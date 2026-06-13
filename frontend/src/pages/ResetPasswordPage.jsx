import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, RefreshCcw } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/shared/Toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resendOtp } = useAuth();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [email, setEmail] = useState('');
  const [step, setStep] = useState(initialToken ? 2 : 1);
  const [form, setForm] = useState({ token: initialToken, newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
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

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      notify('Mã OTP đã được gửi đến email của bạn.');
      setStep(2);
      startTimer();
    } catch (err) {
      notify(err.message || 'Yêu cầu thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await resendOtp(email);
      notify('Mã OTP mới đã được gửi thành công.');
      startTimer();
    } catch (err) {
      notify(err.message || 'Không thể gửi lại mã OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return notify('Mật khẩu xác nhận không khớp!', 'warning');
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: form.token, newPassword: form.newPassword }),
      });
      notify('Đặt lại mật khẩu thành công! Chuyển hướng đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      notify(err.message || 'Đặt lại mật khẩu thất bại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors";
  const labelClass = "block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2";

  return (
    <AuthLayout title="Đặt Lại Mật Khẩu" subtitle={step === 1 ? "Nhập email để nhận mã OTP" : "Nhập mã xác thực và mật khẩu mới của bạn"}>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
      
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
          <div>
            <label className={labelClass}>Email của bạn</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="example@gmail.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </button>
          <div className="flex justify-between items-center text-sm">
            <Link to="/login" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
          <div>
            <label className={labelClass}>
              Mã xác thực OTP
            </label>
            <input
              type="text"
              required
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              className={inputClass}
              placeholder="Nhập mã OTP từ email"
            />
          </div>

          <div>
            <label className={labelClass}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className={labelClass}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <KeyRound size={18} />
            {loading ? 'Đang thực hiện...' : 'Cập nhật mật khẩu'}
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

          <div className="flex justify-between items-center text-sm pt-2">
            <button type="button" onClick={() => {
              setStep(1);
              setTimer(0);
            }} className="text-slate-500 hover:text-slate-800">
              Thay đổi Email
            </button>
            <Link to="/login" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

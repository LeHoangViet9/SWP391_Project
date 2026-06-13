import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, ShieldCheck, RefreshCcw } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from './shared/Toast';

export default function ChangePassword() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
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

  const handleRequestOtp = async () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      return notify('Vui lòng điền đầy đủ thông tin mật khẩu!', 'warning');
    }
    if (form.newPassword !== form.confirmPassword) {
      return notify('Mật khẩu xác nhận không trùng khớp!', 'warning');
    }
    
    setLoading(true);
    try {
      await apiFetch('/auth/profile/request-otp', { method: 'POST' });
      setOtpSent(true);
      notify('Mã OTP đã được gửi đến email của bạn.');
      startTimer();
    } catch (err) {
      notify(err.message || 'Không thể gửi mã OTP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await apiFetch('/auth/profile/resend-otp', { method: 'POST' });
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
    if (!otpSent) {
      handleRequestOtp();
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
          otp: form.otp
        }),
      });
      notify('Thay đổi mật khẩu thành công!');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '', otp: '' });
      setOtpSent(false);
    } catch (err) {
      notify(err.message || 'Thay đổi mật khẩu thất bại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
      
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6">
        <ShieldAlert className="shrink-0 mt-0.5" size={18} />
        <div className="text-xs space-y-1">
          <p className="font-semibold">Bảo mật tài khoản</p>
          <p>Bắt buộc xác thực OTP để đảm bảo an toàn cho tài khoản của bạn.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Mật khẩu hiện tại *</label>
          <input
            type="password"
            required
            disabled={otpSent}
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none disabled:bg-stone-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Mật khẩu mới *</label>
          <input
            type="password"
            required
            disabled={otpSent}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none disabled:bg-stone-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Xác nhận mật khẩu mới *</label>
          <input
            type="password"
            required
            disabled={otpSent}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none disabled:bg-stone-50"
          />
        </div>

        {otpSent && (
          <div className="pt-4 border-t border-stone-100 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-bold text-[#bfa15f] mb-1 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={14}/> Nhập mã OTP đã nhận *
            </label>
            <input
              type="text"
              required
              placeholder="000000"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              className="w-full border-2 border-[#bfa15f]/30 rounded px-3 py-2 text-lg font-bold tracking-widest text-center focus:border-[#bfa15f] outline-none bg-amber-50/30"
            />
            <div className="flex flex-col items-center gap-2 mt-2">
              <p className="text-[10px] text-slate-400 italic text-center">Vui lòng kiểm tra email của bạn để lấy mã bảo mật</p>
              {timer > 0 ? (
                <p className="text-[10px] text-slate-500">
                  Gửi lại sau: <span className="font-bold text-[#bfa15f]">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="flex items-center gap-1 text-[#bfa15f] font-semibold hover:underline text-[10px]"
                >
                  <RefreshCcw size={10} className={loading ? 'animate-spin' : ''} />
                  Gửi lại mã OTP
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {!otpSent ? (
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-5 py-2.5 rounded text-sm font-semibold shadow-sm transition-all"
            >
              Tiếp tục
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setTimer(0);
                }}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-5 py-2.5 rounded text-sm font-semibold shadow-md transition-all"
              >
                {loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { apiFetch } from '../services/api';
import Toast from '../components/shared/Toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ token: token, newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tokenTrimmed = form.token.trim();
    const newPasswordTrimmed = form.newPassword.trim();
    const confirmPasswordTrimmed = form.confirmPassword.trim();
    
    if (newPasswordTrimmed !== confirmPasswordTrimmed) {
      return notify('Mật khẩu xác nhận không khớp!', 'warning');
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: tokenTrimmed, newPassword: newPasswordTrimmed, confirmPassword: confirmPasswordTrimmed }),
      });
      notify('Đặt lại mật khẩu thành công! Chuyển hướng đăng nhập...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const fieldErrors = err.data?.data;
      if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) {
        notify(Object.values(fieldErrors)[0], 'error');
      } else {
        notify(err.message || 'Đặt lại mật khẩu thất bại.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đặt Lại Mật Khẩu" subtitle="Nhập mã xác thực và mật khẩu mới của bạn">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
      
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            Mã xác thực (Token/OTP)
          </label>
          <input
            type="text"
            required
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
            className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors"
            placeholder="Nhập mã token từ email"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            Mật khẩu mới
          </label>
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors"
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

        <div className="flex justify-between items-center text-sm">
          <Link to="/login" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

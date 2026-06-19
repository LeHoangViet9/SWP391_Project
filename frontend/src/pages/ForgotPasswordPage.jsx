import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import { apiFetch } from '../services/api';
import Toast from '../components/shared/Toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      notify('Yêu cầu đặt lại mật khẩu đã được gửi! Đang chuyển hướng sang trang nhập OTP...');
      setTimeout(() => {
        navigate(`/forgot-password-otp?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      notify(err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Quên Mật Khẩu" subtitle="Nhập email đăng ký để nhận liên kết khôi phục mật khẩu">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
      
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            Địa chỉ Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors"
            placeholder="example@hotel.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-gold py-3.5 rounded flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Send size={18} />
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu khôi phục'}
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

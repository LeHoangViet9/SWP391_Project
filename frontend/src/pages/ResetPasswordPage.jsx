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
    if (form.newPassword !== form.confirmPassword) {
      return notify('Confirm password does not match!', 'warning');
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: form.token, newPassword: form.newPassword }),
      });
      notify('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      notify(err.message || 'Password reset failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter the verification code and your new password">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
      
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 shadow-lg p-8 space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            Verification Code (Token/OTP)
          </label>
          <input
            type="text"
            required
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
            className="w-full border border-stone-300 px-4 py-3 text-slate-800 outline-none focus:border-[#bfa15f] transition-colors"
            placeholder="Enter the token from your email"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            New Password
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
            Confirm New Password
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
          {loading ? 'Processing...' : 'Update Password'}
        </button>

        <div className="flex justify-between items-center text-sm">
          <Link to="/login" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

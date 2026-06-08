import React, { useState } from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from './shared/Toast';

export default function ChangePassword() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return notify('Mật khẩu xác nhận không trùng khớp!', 'warning');
    }
    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }),
      });
      notify('Thay đổi mật khẩu thành công!');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      notify(err.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
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
          <p>Mật khẩu mới phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Mật khẩu hiện tại *</label>
          <input
            type="password"
            required
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Mật khẩu mới *</label>
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider font-display">Xác nhận mật khẩu mới *</label>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-5 py-2.5 rounded text-sm font-semibold shadow disabled:opacity-60 transition-colors"
        >
          <KeyRound size={16} />
          {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}

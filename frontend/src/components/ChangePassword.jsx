import React, { useState } from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';

export default function ChangePassword() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return notify(t('changePassword.toast.mismatch'), 'warning');
    }
    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
          confirmNewPassword: form.confirmPassword,
        }),
      });
      notify(t('changePassword.toast.success'));
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      // Bảo mật: xóa token và chuyển về trang đăng nhập sau 2 giây
      setTimeout(() => {
        localStorage.removeItem('hms_token');
        navigate('/login');
      }, 2000);
    } catch (err) {
      const fieldErrors = err.data?.data;
      if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) {
        notify(Object.values(fieldErrors)[0], 'error');
      } else {
        notify(err.message || t('changePassword.toast.error'), 'error');
      }
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
          <p className="font-semibold">{t('changePassword.title')}</p>
          <p>{t('changePassword.hint')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('changePassword.oldPassword')}</label>
          <input
            type="password"
            required
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('changePassword.newPassword')}</label>
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider font-display">{t('changePassword.confirmPassword')}</label>
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
          {loading ? t('changePassword.updating') : t('changePassword.submitBtn')}
        </button>
      </form>
    </div>
  );
}

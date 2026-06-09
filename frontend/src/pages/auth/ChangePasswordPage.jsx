import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import { changePassword } from '../../services/authService';

export default function ChangePasswordPage() {
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmNewPassword) {
      showToast(t('auth.errPasswordMatch'), 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await changePassword(form, locale);
      showToast(res.message || t('staff.auth.changeSuccess'), 'success');
      setForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold text-slate-800 mb-1">
        {t('staff.auth.changePassword')}
      </h1>
      <p className="text-slate-500 text-sm mb-6">{t('staff.auth.changePasswordDesc')}</p>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('staff.auth.oldPassword')}
          </label>
          <input
            type="password"
            required
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('staff.auth.newPassword')}
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('auth.rePassword')}
          </label>
          <input
            type="password"
            required
            value={form.confirmNewPassword}
            onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
            className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-gold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          <KeyRound size={16} />
          {loading ? '...' : t('staff.auth.changePassword')}
        </button>
      </form>
    </div>
  );
}

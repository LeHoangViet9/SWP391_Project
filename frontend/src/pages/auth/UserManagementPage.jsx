import { useState } from 'react';
import { UserPlus, X, Users } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import { register } from '../../services/authService';
import { STAFF_ROLES_FOR_REGISTER } from '../../utils/constants';

const EMPTY_FORM = {
  fullName: '',
  userName: '',
  email: '',
  phone: '',
  password: '',
  rePassword: '',
  roleName: '',
};

export default function UserManagementPage() {
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.rePassword) {
      showToast(t('auth.errPasswordMatch'), 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await register(
        {
          fullName: form.fullName,
          userName: form.userName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          rePassword: form.rePassword,
        },
        locale
      );
      showToast(res.message || t('staff.users.registerSuccess'), 'success');
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeInUp">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('staff.users.title')}</h1>
          <p className="page-subtitle">{t('staff.users.subtitle')}</p>
        </div>
        <button
          onClick={openModal}
          className="btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm self-start"
        >
          <UserPlus size={16} />
          {t('staff.users.register')}
        </button>
      </div>

      {/* Info card about roles */}
      <div className="hms-card p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 rounded-lg shrink-0">
            <Users size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 mb-1">{t('staff.users.roleNote')}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {STAFF_ROLES_FOR_REGISTER.map((r) => (
                <span key={r} className="px-3 py-1 bg-stone-100 rounded-full text-xs font-medium text-slate-600">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for staff list (when API is available) */}
      <div className="hms-card p-8 text-center">
        <div className="inline-flex p-4 bg-stone-100 rounded-2xl mb-4">
          <Users size={28} className="text-slate-400" />
        </div>
        <h3 className="font-display font-semibold text-slate-800 mb-1">{t('staff.users.staffList')}</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Danh sách nhân viên sẽ hiển thị ở đây khi backend hỗ trợ API GET /api/v1/auth/users.
        </p>
      </div>

      {/* ─── Modal: Add Staff ───────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#bfa15f]/10 rounded-lg">
                  <UserPlus size={18} className="text-[#bfa15f]" />
                </div>
                <h2 className="font-display font-bold text-lg text-slate-800">
                  {t('staff.users.register')}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="hms-label">{t('auth.fullName')} *</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="hms-input"
                  />
                </div>
                <div>
                  <label className="hms-label">{t('auth.username')} *</label>
                  <input
                    required
                    pattern="^[a-zA-Z0-9_]+$"
                    value={form.userName}
                    onChange={(e) => setForm({ ...form, userName: e.target.value })}
                    className="hms-input"
                    placeholder="vd: nhanvien01"
                  />
                </div>
                <div>
                  <label className="hms-label">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="hms-input"
                  />
                </div>
                <div>
                  <label className="hms-label">{t('auth.phone')} *</label>
                  <input
                    required
                    pattern="^(0|\+84)[0-9]{9}$"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="hms-input"
                    placeholder="0912345678"
                  />
                </div>
                <div>
                  <label className="hms-label">{t('auth.password')} *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="hms-input"
                  />
                </div>
                <div>
                  <label className="hms-label">{t('auth.rePassword')} *</label>
                  <input
                    type="password"
                    required
                    value={form.rePassword}
                    onChange={(e) => setForm({ ...form, rePassword: e.target.value })}
                    className="hms-input"
                  />
                </div>
              </div>

              {/* Role dropdown */}
              <div>
                <label className="hms-label">{t('staff.users.role')}</label>
                <select
                  value={form.roleName}
                  onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                  className="hms-select"
                >
                  <option value="">{t('staff.users.selectRole')}</option>
                  {STAFF_ROLES_FOR_REGISTER.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  * Backend hiện gán role CUSTOMER mặc định. Cần cập nhật role qua database sau khi tạo.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm disabled:opacity-60"
                >
                  <UserPlus size={16} />
                  {loading ? '...' : t('staff.users.register')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Mail, Phone, ShieldCheck, Clock, BadgeCheck, RefreshCw, Edit2, Save, X, User, Globe, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { getMyCustomerProfile, updateCustomer } from '../services/customerService';
import Toast from './shared/Toast';

function formatDateTime(value, locale) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const ID_TYPES = ['CCCD', 'PASSPORT', 'OTHER'];

export default function AccountInfo() {
  const { user, refreshCurrentUser } = useAuth();
  const { locale, t } = useLocale();
  const [profile, setProfile] = useState(user);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', nationality: '', idType: 'CCCD', idNumberCard: '', email: '' });
  const [errors, setErrors] = useState({});

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(currentToast => ({ ...currentToast, message: '' }));

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userRes, customerRes] = await Promise.all([
        refreshCurrentUser(),
        getMyCustomerProfile(locale),
      ]);
      setProfile(userRes?.data || user);
      if (customerRes?.data) {
        setCustomerProfile(customerRes.data);
      }
    } catch (err) {
      setError(err.message || t('accountInfo.loadError'));
      setProfile(user);
    } finally {
      setLoading(false);
    }
  }, [locale, refreshCurrentUser, t]);

  useEffect(() => {
    loadProfile();
  }, [locale, loadProfile]);

  const openEdit = () => {
    if (!customerProfile) return;
    setForm({
      fullName: customerProfile.fullName || '',
      phone: customerProfile.phone || '',
      nationality: customerProfile.nationality || '',
      idType: customerProfile.idType || 'CCCD',
      idNumberCard: customerProfile.idCard || '',
      email: customerProfile.email || '',
    });
    setErrors({});
    setEditing(true);
  };

  const validateField = (name, value) => {
    const trimmed = value ? value.trim() : '';
    if (name === 'fullName') {
      if (!trimmed) return t('accountInfo.validation.fullNameEmpty');
      if (/\s{2,}/.test(value)) return t('accountInfo.validation.fullNameSpace');
    }
    if (name === 'phone') {
      if (!trimmed) return t('accountInfo.validation.phoneEmpty');
      if (!/^0[0-9]{9}$/.test(trimmed)) return t('accountInfo.validation.phoneFormat');
    }
    if (name === 'nationality') {
      if (!trimmed) return t('accountInfo.validation.nationalityEmpty');
    }
    return '';
  };

  const handleChange = (name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nameErr = validateField('fullName', form.fullName);
    const phoneErr = validateField('phone', form.phone);
    const natErr = validateField('nationality', form.nationality);
    if (nameErr || phoneErr || natErr) {
      setErrors({ fullName: nameErr, phone: phoneErr, nationality: natErr });
      return;
    }
    setSaving(true);
    try {
      await updateCustomer(customerProfile.id, {
        fullName: form.fullName.trim(),
        email: form.email,
        phone: form.phone.trim(),
        idType: form.idType,
        idNumberCard: form.idNumberCard,
        nationality: form.nationality.trim(),
      }, locale);
      notify(t('accountInfo.toast.updateSuccess'), 'success');
      setEditing(false);
      await loadProfile();
    } catch (err) {
      notify(err.message || t('accountInfo.toast.updateFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const accountItems = useMemo(() => ([
    { icon: Mail, label: t('accountInfo.email'), value: profile?.email || '-' },
    { icon: Phone, label: t('accountInfo.phone'), value: profile?.phone || '-' },
    { icon: ShieldCheck, label: t('accountInfo.role'), value: profile?.roleName || '-' },
    { icon: BadgeCheck, label: t('accountInfo.status'), value: profile?.accountStatus || '-' },
    { icon: Clock, label: t('accountInfo.lastLogin'), value: formatDateTime(profile?.lastLoginAt, locale) },
  ]), [profile, locale, t]);

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#bfa15f] text-xl font-bold text-white">
            {profile?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{profile?.fullName || t('accountInfo.unknownUser')}</h3>
            <p className="text-sm text-slate-500">{t('accountInfo.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && customerProfile && (
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center justify-center gap-2 rounded border border-[#bfa15f] px-3 py-2 text-sm font-semibold text-[#bfa15f] transition-colors hover:bg-[#bfa15f] hover:text-white"
            >
              <Edit2 size={15} />
              {t('accountInfo.edit')}
            </button>
          )}
          <button
            type="button"
            onClick={loadProfile}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded border border-stone-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-[#bfa15f] hover:text-[#bfa15f] disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {t('accountInfo.refresh')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Tài khoản hệ thống (chỉ đọc) */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t('accountInfo.systemAccount')}</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accountItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#bfa15f]">
                <Icon size={15} />
                {label}
              </div>
              <p className="break-words text-sm font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Thông tin Hồ sơ Khách hàng */}
      {customerProfile && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t('accountInfo.customerProfile')}</p>

          {!editing ? (
            // --- Chế độ Xem ---
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { icon: User, label: t('accountInfo.fullName'), value: customerProfile.fullName },
                { icon: Phone, label: t('accountInfo.phone'), value: customerProfile.phone },
                { icon: Globe, label: t('accountInfo.nationality'), value: customerProfile.nationality },
                { icon: CreditCard, label: t('accountInfo.idType'), value: customerProfile.idType },
                { icon: CreditCard, label: t('accountInfo.idCard'), value: customerProfile.idCard },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#bfa15f]">
                    <Icon size={15} />
                    {label}
                  </div>
                  <p className="break-words text-sm font-semibold text-slate-800">{value || '-'}</p>
                </div>
              ))}
            </div>
          ) : (
            // --- Chế độ Chỉnh sửa ---
            <form onSubmit={handleSave} className="rounded-lg border border-[#bfa15f]/30 bg-amber-50/30 p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Họ và tên */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    {t('accountInfo.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    onBlur={e => handleChange('fullName', e.target.value)}
                    className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-1 ${errors.fullName ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    {t('accountInfo.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    onBlur={e => handleChange('phone', e.target.value)}
                    className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-1 ${errors.phone ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* Quốc tịch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                    {t('accountInfo.nationality')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.nationality}
                    onChange={e => handleChange('nationality', e.target.value)}
                    onBlur={e => handleChange('nationality', e.target.value)}
                    className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-1 ${errors.nationality ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`}
                  />
                  {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                </div>

                {/* Loại giấy tờ — chỉ đọc */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('accountInfo.idType')} <span className="text-slate-400 font-normal normal-case">{t('accountInfo.cannotChangeParentheses')}</span></label>
                  <input
                    readOnly
                    value={form.idType}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm bg-stone-100 text-slate-400 cursor-not-allowed"
                  />
                </div>

                {/* Số giấy tờ — chỉ đọc, không được sửa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">{t('accountInfo.idCard')} <span className="text-slate-400 font-normal normal-case">{t('accountInfo.cannotChangeParentheses')}</span></label>
                  <input
                    readOnly
                    value={form.idNumberCard}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm bg-stone-100 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-5 py-2 rounded text-sm font-semibold shadow disabled:opacity-60 transition-colors"
                >
                  <Save size={15} />
                  {saving ? t('accountInfo.saving') : t('accountInfo.saveChanges')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="flex items-center gap-2 border border-stone-300 text-slate-600 px-5 py-2 rounded text-sm font-semibold hover:bg-stone-50 transition-colors"
                >
                  <X size={15} />
                  {t('accountInfo.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

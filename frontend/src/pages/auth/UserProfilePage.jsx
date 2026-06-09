import { useState } from 'react';
import { User, Mail, Phone, Shield, Clock, KeyRound, Eye, EyeOff, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import { changePassword } from '../../services/authService';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDateTime } from '../../utils/formatters';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="p-2 bg-[#bfa15f]/10 rounded-lg shrink-0">
        <Icon size={16} className="text-[#bfa15f]" />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { showToast } = useToast();

  const [showPwSection, setShowPwSection] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      showToast(t('auth.errPasswordMatch'), 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await changePassword(pwForm, locale);
      showToast(res.message || t('staff.auth.changeSuccess'), 'success');
      setPwForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
      setShowPwSection(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fadeInUp">
      <div className="mb-6">
        <h1 className="page-title">{t('staff.profile.title')}</h1>
        <p className="page-subtitle">{t('staff.profile.subtitle')}</p>
      </div>

      {/* Profile Card */}
      <div className="hms-card p-6 mb-6">
        {/* Avatar header */}
        <div className="flex items-center gap-4 pb-5 border-b border-stone-100 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
               style={{ background: 'linear-gradient(135deg, #bfa15f 0%, #a88a4a 100%)' }}>
            {user?.fullName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-slate-800">{user?.fullName}</h2>
            <p className="text-sm text-slate-400">@{user?.username || user?.userName}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-stone-50">
          <InfoRow icon={Mail} label={t('staff.profile.email')} value={user?.email} />
          <InfoRow icon={Phone} label={t('staff.profile.phone')} value={user?.phone} />
          <InfoRow icon={Shield} label={t('staff.profile.role')} value={user?.roleName} />
          <div className="flex items-start gap-3 py-3">
            <div className="p-2 bg-[#bfa15f]/10 rounded-lg shrink-0">
              <Clock size={16} className="text-[#bfa15f]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{t('staff.profile.accountStatus')}</p>
              <div className="mt-1">
                <StatusBadge status={user?.accountStatus || 'ACTIVE'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="hms-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPwSection(!showPwSection)}
          className="w-full flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <KeyRound size={16} className="text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-800">{t('staff.profile.changePasswordSection')}</p>
              <p className="text-xs text-slate-400">{t('staff.auth.changePasswordDesc')}</p>
            </div>
          </div>
          <span className={`text-slate-400 transition-transform ${showPwSection ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {showPwSection && (
          <form onSubmit={handleChangePassword} className="px-5 pb-5 space-y-4 animate-fadeIn border-t border-stone-100 pt-4">
            <div>
              <label className="hms-label">{t('staff.auth.oldPassword')}</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  value={pwForm.oldPassword}
                  onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                  className="hms-input pr-10"
                />
                <button type="button" onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="hms-label">{t('staff.auth.newPassword')}</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="hms-input pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="hms-label">{t('auth.rePassword')}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={pwForm.confirmNewPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmNewPassword: e.target.value })}
                  className="hms-input pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm disabled:opacity-60"
            >
              <Save size={16} />
              {loading ? '...' : t('staff.auth.changePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, ShieldCheck, Clock, BadgeCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

function formatDateTime(value, locale) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function AccountInfo() {
  const { user, refreshCurrentUser } = useAuth();
  const { locale, t } = useLocale();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await refreshCurrentUser();
      setProfile(res?.data || user);
    } catch (err) {
      setError(err.message || t('accountInfo.loadError'));
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [locale]);

  const items = useMemo(() => ([
    { icon: Mail, label: t('accountInfo.email'), value: profile?.email || '-' },
    { icon: Phone, label: t('accountInfo.phone'), value: profile?.phone || '-' },
    { icon: ShieldCheck, label: t('accountInfo.role'), value: profile?.roleName || '-' },
    { icon: BadgeCheck, label: t('accountInfo.status'), value: profile?.accountStatus || '-' },
    { icon: Clock, label: t('accountInfo.lastLogin'), value: formatDateTime(profile?.lastLoginAt, locale) },
  ]), [profile, locale, t]);

  return (
    <div className="space-y-5">
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

      {error && (
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ icon: Icon, label, value }) => (
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
  );
}

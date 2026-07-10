import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { getAuditLogs } from '../services/auditLogService';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';

const STATUS_OPTIONS = [
  { value: '', key: 'all' },
  { value: 'SUCCESS', key: 'SUCCESS' },
  { value: 'FAILED', key: 'FAILED' },
];

const MODULE_OPTIONS = [
  { value: '', key: 'all' },
  { value: 'AUTH', key: 'AUTH' },
  { value: 'USER', key: 'USER' },
  { value: 'ROOM', key: 'ROOM' },
  { value: 'BOOKING', key: 'BOOKING' },
  { value: 'CUSTOMER', key: 'CUSTOMER' },
  { value: 'BILLING', key: 'BILLING' },
  { value: 'HOUSEKEEPING', key: 'HOUSEKEEPING' },
  { value: 'MAINTENANCE', key: 'MAINTENANCE' },
  { value: 'EQUIPMENT', key: 'EQUIPMENT' },
  { value: 'REPORT', key: 'REPORT' },
  { value: 'API', key: 'API' },
  { value: 'CHECKOUT', key: 'CHECKOUT' },
  { value: 'HOUSEKEEPING_TASKS', key: 'HOUSEKEEPING_TASKS' },
  { value: 'FEEDBACKS', key: 'FEEDBACKS' },
  { value: 'CHECKIN', key: 'CHECKIN' },
  { value: 'NOTIFICATIONS', key: 'NOTIFICATIONS' },
];

const DEFAULT_FILTERS = {
  action: '',
  module: '',
  actorUserId: '',
  status: '',
  fromTime: '',
  toTime: '',
};

export default function AuditLogManager() {
  const { locale, t } = useLocale();

  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);


  const closeToast = () => setToast((current) => ({ ...current, message: '' }));

  const apiFilters = useMemo(() => ({
    action: appliedFilters.action.trim(),
    module: appliedFilters.module,
    actorUserId: appliedFilters.actorUserId,
    status: appliedFilters.status,
    fromTime: appliedFilters.fromTime ? new Date(appliedFilters.fromTime).toISOString() : '',
    toTime: appliedFilters.toTime ? new Date(appliedFilters.toTime).toISOString() : '',
    page,
    size: 10,
  }), [appliedFilters, page]);

  const pageStats = useMemo(() => {
    const success = logs.filter((log) => log.status === 'SUCCESS').length;
    const failed = logs.filter((log) => log.status === 'FAILED').length;
    return { success, failed, total: logs.length };
  }, [logs]);

  const activeFilterCount = useMemo(() => (
    Object.values(appliedFilters).filter((value) => value !== '').length
  ), [appliedFilters]);

  const translate = useCallback((key, params) => t(`auditLog.${key}`, params), [t]);

  const translateOrFallback = useCallback((key, fallback) => {
    const value = translate(key);
    return value === `auditLog.${key}` ? fallback : value;
  }, [translate]);

  const loadLogs = useCallback(async (requestFilters = apiFilters) => {
    setLoading(true);
    try {
      const response = await getAuditLogs(requestFilters, locale);
      const data = response?.data;
      setLogs(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch (error) {
      setToast({
        type: 'error',
        message: error.message || translate('toast.loadError'),
      });
    } finally {
      setLoading(false);
    }
  }, [apiFilters, locale, translate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
    if (page !== 0) setPage(0);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    if (page !== 0) setPage(0);
  };

  const formatTime = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const getStatusLabel = (status, fallback) => (
    fallback || translateOrFallback(`statusOptions.${status || 'all'}`, status || translate('statusOptions.all'))
  );

  const getModuleLabel = (module, fallback) => (
    fallback || translateOrFallback(`moduleOptions.${module || 'all'}`, module || translate('moduleOptions.all'))
  );

  const renderMessageSummary = (log) => (
    <div className="flex max-w-[400px] flex-col gap-1.5">
      {log.messageText ? (
        <p className="text-xs font-medium leading-relaxed text-slate-700">
          {log.messageText}
        </p>
      ) : (
        <span className="text-xs text-slate-400">{translate('empty.noDetails')}</span>
      )}
    </div>
  );

  const renderStatus = (log) => {
    const success = log.status === 'SUCCESS';
    const Icon = success ? CheckCircle2 : AlertTriangle;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        success
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : 'bg-red-50 text-red-700 ring-1 ring-red-100'
      }`}>
        <Icon size={13} />
        {getStatusLabel(log.status, log.statusLabel)}
      </span>
    );
  };

  const renderFilterSelect = (labelKey, value, field, options, optionGroup) => (
    <label className="min-w-0 space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{translate(labelKey)}</span>
      <select
        value={value}
        onChange={(event) => handleFilterChange(field, event.target.value)}
        className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
      >
        {options.map((option) => (
          <option key={option.key} value={option.value}>
            {translateOrFallback(`${optionGroup}.${option.key}`, option.value || translate(`${optionGroup}.all`))}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-[#bfa15f] shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{translate('title')}</h2>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#bfa15f]/10 px-2.5 py-1 text-xs font-bold text-[#8a6f32]">
                  {translate('activeFilters', { count: activeFilterCount })}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {translate('subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
          <StatTile label={translate('stats.thisPage')} value={pageStats.total} tone="slate" />
          <StatTile label={translate('stats.success')} value={pageStats.success} tone="green" />
          <StatTile label={translate('stats.failed')} value={pageStats.failed} tone="red" />
        </div>
      </div>

      <form onSubmit={handleSearch} className="rounded-xl border border-stone-200 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter size={16} className="text-[#bfa15f]" />
            {translate('filters.title')}
          </div>
          <button
            type="button"
            onClick={() => loadLogs()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-bold text-slate-600 hover:bg-stone-50"
          >
            <RefreshCw size={13} />
            {translate('actions.reload')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{translate('filters.action')}</span>
            <input
              value={filters.action}
              onChange={(event) => handleFilterChange('action', event.target.value)}
              placeholder="LOGIN_SUCCESS"
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
            />
          </label>

          {renderFilterSelect('filters.module', filters.module, 'module', MODULE_OPTIONS, 'moduleOptions')}

          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{translate('filters.actorId')}</span>
            <input
              type="number"
              min="1"
              value={filters.actorUserId}
              onChange={(event) => handleFilterChange('actorUserId', event.target.value)}
              placeholder="1"
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
            />
          </label>

          {renderFilterSelect('filters.status', filters.status, 'status', STATUS_OPTIONS, 'statusOptions')}

          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{translate('filters.from')}</span>
            <input
              type="datetime-local"
              value={filters.fromTime}
              onChange={(event) => handleFilterChange('fromTime', event.target.value)}
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
            />
          </label>

          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{translate('filters.to')}</span>
            <input
              type="datetime-local"
              value={filters.toTime}
              onChange={(event) => handleFilterChange('toTime', event.target.value)}
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-stone-50"
          >
            <X size={15} />
            {translate('actions.clear')}
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
          >
            <Search size={15} />
            {translate('actions.apply')}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="border-b border-stone-200 bg-white text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-bold">ID</th>
                <th className="px-4 py-3 text-left font-bold">{translate('table.time')}</th>
                <th className="px-4 py-3 text-left font-bold">{translate('table.action')}</th>
                <th className="px-4 py-3 text-left font-bold">{translate('table.status')}</th>
                <th className="px-4 py-3 text-left font-bold">{translate('table.actor')}</th>
                <th className="px-4 py-3 text-left font-bold">{translate('table.message')}</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#bfa15f] border-t-transparent" />
                    {translate('loading')}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                    {translate('empty.noLogs')}
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">#{log.id}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatTime(log.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="text-xs font-bold text-slate-800">{log.actionLabel || log.action}</div>
                    <div className="mt-1 text-[11px] font-semibold uppercase text-slate-400">
                      {getModuleLabel(log.module, log.moduleLabel)}
                    </div>
                  </td>
                  <td className="px-4 py-4">{renderStatus(log)}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-800">{log.actorUsername || '-'}</div>
                    <div className="mt-1 text-xs text-slate-400">{log.actorRole || log.actorEmail || '-'}</div>
                  </td>
                  <td className="px-4 py-4">{renderMessageSummary(log)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {translate('pagination.page')} <strong>{page + 1}</strong> / {Math.max(totalPages, 1)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={page === 0}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {translate('pagination.previous')}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, Math.max(totalPages - 1, 0)))}
              disabled={page >= totalPages - 1}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {translate('pagination.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  }[tone] || 'bg-slate-50 text-slate-700 ring-slate-200';

  return (
    <div className={`rounded-lg px-3 py-2 ring-1 ${toneClass}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}



import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { getAuditLogs } from '../services/auditLogService';
import { useLocale } from '../context/LocaleContext';
import DataTable from './shared/DataTable';
import Toast from './shared/Toast';

const STATUS_OPTIONS = ['', 'SUCCESS', 'FAILED'];
const MODULE_OPTIONS = ['', 'AUTH', 'USER', 'ROOM', 'BOOKING', 'CUSTOMER', 'BILLING', 'HOUSEKEEPING', 'MAINTENANCE', 'EQUIPMENT'];
const RESOURCE_OPTIONS = ['', 'USER', 'ROOM', 'BOOKING', 'CUSTOMER', 'PAYMENT', 'INVOICE', 'HOUSEKEEPING_TASK', 'MAINTENANCE_TASK', 'EQUIPMENT'];
const DEFAULT_FILTERS = {
  action: '',
  module: '',
  resourceType: '',
  actorUserId: '',
  status: '',
  fromTime: '',
  toTime: '',
};

export default function AuditLogManager() {
  const { locale } = useLocale();
  const isVi = locale === 'vi';

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
    resourceType: appliedFilters.resourceType,
    actorUserId: appliedFilters.actorUserId,
    status: appliedFilters.status,
    fromTime: appliedFilters.fromTime ? new Date(appliedFilters.fromTime).toISOString() : '',
    toTime: appliedFilters.toTime ? new Date(appliedFilters.toTime).toISOString() : '',
    page,
    size: 10,
  }), [appliedFilters, page]);

  const loadLogs = async (requestFilters = apiFilters) => {
    setLoading(true);
    try {
      const response = await getAuditLogs(requestFilters, locale);
      const data = response?.data;
      setLogs(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch (error) {
      setToast({
        type: 'error',
        message: error.message || (isVi ? 'Khong tai duoc audit log' : 'Failed to load audit logs'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [locale, apiFilters]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedFilters(filters);
    if (page !== 0) {
      setPage(0);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    if (page !== 0) {
      setPage(0);
    }
  };

  const formatTime = (value) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(value));
  };

  const isPlainObject = (value) => (
    value !== null && typeof value === 'object' && !Array.isArray(value)
  );

  const formatFieldName = (field) => String(field)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatChangeValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? (isVi ? 'Co' : 'Yes') : 'No';
    if (Array.isArray(value)) return `${value.length} ${isVi ? 'muc' : 'items'}`;
    if (isPlainObject(value)) {
      return value.name || value.fullName || value.roomNumber || value.email || value.id || `${Object.keys(value).length} ${isVi ? 'truong' : 'fields'}`;
    }
    return String(value);
  };

  const hasDifferentValue = (beforeValue, afterValue) => (
    JSON.stringify(beforeValue) !== JSON.stringify(afterValue)
  );

  const renderValue = (value, tone = 'default') => (
    <span className={`break-words ${
      tone === 'before'
        ? 'text-slate-500 line-through decoration-slate-300'
        : tone === 'after'
          ? 'font-semibold text-slate-800'
          : 'text-slate-700'
    }`}>
      {formatChangeValue(value)}
    </span>
  );

  const renderChanges = (changes) => {
    if (!changes) return '-';

    const before = changes.before;
    const after = changes.after;
    const hasBeforeAfter = Object.prototype.hasOwnProperty.call(changes, 'before')
      || Object.prototype.hasOwnProperty.call(changes, 'after');

    if (hasBeforeAfter && isPlainObject(before) && isPlainObject(after)) {
      const fields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
        .filter((field) => hasDifferentValue(before[field], after[field]))
        .slice(0, 8);

      if (fields.length === 0) {
        return <span className="text-xs text-slate-400">{isVi ? 'Khong co thay doi' : 'No changes'}</span>;
      }

      return (
        <div className="max-w-[520px] rounded-md border border-stone-200 bg-white text-xs text-slate-600">
          <div className="grid grid-cols-[120px_1fr_1fr] border-b border-stone-100 bg-slate-50 px-3 py-2 font-semibold text-slate-500">
            <span>{isVi ? 'Truong' : 'Field'}</span>
            <span>{isVi ? 'Truoc' : 'Before'}</span>
            <span>{isVi ? 'Sau' : 'After'}</span>
          </div>
          {fields.map((field) => (
            <div key={field} className="grid grid-cols-[120px_1fr_1fr] gap-3 border-b border-stone-100 px-3 py-2 last:border-b-0">
              <span className="font-medium text-slate-500">{formatFieldName(field)}</span>
              {renderValue(before[field], 'before')}
              {renderValue(after[field], 'after')}
            </div>
          ))}
        </div>
      );
    }

    const visibleChanges = isPlainObject(after)
      ? after
      : isPlainObject(changes)
        ? changes
        : {};

    const fields = Object.entries(visibleChanges).slice(0, 8);
    if (fields.length === 0) return '-';

    return (
      <div className="max-w-[420px] rounded-md border border-stone-200 bg-white text-xs text-slate-600">
        <div className="border-b border-stone-100 bg-slate-50 px-3 py-2 font-semibold text-slate-500">
          {hasBeforeAfter ? (isVi ? 'Du lieu sau thao tac' : 'Data after action') : (isVi ? 'Chi tiet thay doi' : 'Change details')}
        </div>
        {fields.map(([field, value]) => (
          <div key={field} className="grid grid-cols-[120px_1fr] gap-3 border-b border-stone-100 px-3 py-2 last:border-b-0">
            <span className="font-medium text-slate-500">{formatFieldName(field)}</span>
            {renderValue(value)}
          </div>
        ))}
      </div>
    );
  };

  const rows = logs.map((log) => (
    <tr key={log.id} className="align-top">
      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">#{log.id}</td>
      <td className="px-4 py-3 whitespace-nowrap">{formatTime(log.createdAt)}</td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-slate-700">{log.action}</span>
        <div className="text-[11px] text-slate-400 mt-1">{log.module}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
          log.status === 'SUCCESS'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {log.status}
        </span>
        {log.errorMessage && <div className="text-xs text-red-500 mt-1 max-w-[240px]">{log.errorMessage}</div>}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-700">{log.actorUsername || '-'}</div>
        <div className="text-[11px] text-slate-400">{log.actorRole || '-'}</div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-700">{log.resourceType || '-'}</div>
        <div className="text-[11px] text-slate-400">{log.resourceId || '-'}</div>
      </td>
      <td className="px-4 py-3">{renderChanges(log.changes)}</td>
      <td className="px-4 py-3 text-xs text-slate-500">
        <div>{log.ipAddress || '-'}</div>
        <div className="font-mono text-[10px] mt-1 max-w-[180px] truncate" title={log.requestId}>{log.requestId || '-'}</div>
      </td>
    </tr>
  ));

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-900 text-[#bfa15f] flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Audit Log</h2>
            <p className="text-xs text-slate-500">
              {isVi ? 'Theo doi thao tac quan trong trong he thong' : 'Track important system activities'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-[180px_130px_160px_120px_130px_190px_190px_auto_auto_auto]">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Action</span>
            <input
              value={filters.action}
              onChange={(event) => handleFilterChange('action', event.target.value)}
              placeholder="LOGIN_SUCCESS"
              className="h-9 w-full rounded-md border border-stone-200 px-3 text-sm focus:outline-none focus:border-[#bfa15f]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Module</span>
            <select
              value={filters.module}
              onChange={(event) => handleFilterChange('module', event.target.value)}
              className="h-9 w-full rounded-md border border-stone-200 px-3 text-sm focus:outline-none focus:border-[#bfa15f]"
            >
              {MODULE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option || (isVi ? 'Tat ca' : 'All')}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Resource</span>
            <select
              value={filters.resourceType}
              onChange={(event) => handleFilterChange('resourceType', event.target.value)}
              className="h-9 w-full rounded-md border border-stone-200 px-3 text-sm focus:outline-none focus:border-[#bfa15f]"
            >
              {RESOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option || (isVi ? 'Tat ca' : 'All')}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Actor ID</span>
            <input
              type="number"
              min="1"
              value={filters.actorUserId}
              onChange={(event) => handleFilterChange('actorUserId', event.target.value)}
              placeholder="1"
              className="h-9 w-full rounded-md border border-stone-200 px-3 text-sm focus:outline-none focus:border-[#bfa15f]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</span>
            <select
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              className="h-9 w-full rounded-md border border-stone-200 px-3 text-sm focus:outline-none focus:border-[#bfa15f]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option || (isVi ? 'Tat ca' : 'All')}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{isVi ? 'Tu ngay' : 'From'}</span>
            <input
              type="datetime-local"
              value={filters.fromTime}
              onChange={(event) => handleFilterChange('fromTime', event.target.value)}
              className="h-9 w-full rounded-md border border-stone-200 px-3 text-sm focus:outline-none focus:border-[#bfa15f]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{isVi ? 'Den ngay' : 'To'}</span>
            <input
              type="datetime-local"
              value={filters.toTime}
              onChange={(event) => handleFilterChange('toTime', event.target.value)}
              className="h-9 w-full rounded-md border border-stone-200 px-3 text-sm focus:outline-none focus:border-[#bfa15f]"
            />
          </label>
          <button
            type="submit"
            className="mt-5 h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Search size={15} />
            {isVi ? 'Loc' : 'Filter'}
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-5 h-9 inline-flex items-center justify-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-semibold text-slate-700 hover:bg-stone-50"
          >
            <X size={15} />
            {isVi ? 'Xoa loc' : 'Clear'}
          </button>
          <button
            type="button"
            onClick={() => loadLogs()}
            className="mt-5 h-9 inline-flex items-center justify-center gap-2 rounded-md border border-stone-200 px-3 text-sm font-semibold text-slate-700 hover:bg-stone-50"
          >
            <RefreshCw size={15} />
            {isVi ? 'Tai lai' : 'Reload'}
          </button>
        </form>
      </div>

      <DataTable
        columns={['ID', isVi ? 'Thoi gian' : 'Time', 'Action', 'Status', 'Actor', 'Resource', 'Changes', 'Trace']}
        rows={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText={isVi ? 'Chua co audit log.' : 'No audit logs found.'}
      />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileJson,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { getAuditLogs } from '../services/auditLogService';
import { useLocale } from '../context/LocaleContext';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STATUS_OPTIONS = ['', 'SUCCESS', 'FAILED'];
const MODULE_OPTIONS = ['', 'AUTH', 'USER', 'ROOM', 'BOOKING', 'CUSTOMER', 'BILLING', 'HOUSEKEEPING', 'MAINTENANCE', 'EQUIPMENT', 'REPORT', 'API'];

const STATUS_LABELS = {
  '': { vi: 'Tất cả', en: 'All' },
  'SUCCESS': { vi: 'Thành công', en: 'Success' },
  'FAILED': { vi: 'Thất bại', en: 'Failed' }
};

const MODULE_LABELS = {
  '': { vi: 'Tất cả', en: 'All' },
  'AUTH': { vi: 'Xác thực', en: 'Auth' },
  'USER': { vi: 'Nhân viên', en: 'User' },
  'ROOM': { vi: 'Phòng', en: 'Room' },
  'BOOKING': { vi: 'Đặt phòng', en: 'Booking' },
  'CUSTOMER': { vi: 'Khách hàng', en: 'Customer' },
  'BILLING': { vi: 'Hóa đơn', en: 'Billing' },
  'HOUSEKEEPING': { vi: 'Buồng phòng', en: 'Housekeeping' },
  'MAINTENANCE': { vi: 'Bảo trì', en: 'Maintenance' },
  'EQUIPMENT': { vi: 'Thiết bị', en: 'Equipment' },
  'REPORT': { vi: 'Báo cáo', en: 'Report' },
  'API': { vi: 'API hệ thống', en: 'API' }
};

const DEFAULT_FILTERS = {
  action: '',
  module: '',
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
  const [selectedLog, setSelectedLog] = useState(null);

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

  const isPlainObject = (value) => (
    value !== null && typeof value === 'object' && !Array.isArray(value)
  );

  const formatFieldName = (field) => String(field)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatMessageValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? (isVi ? 'Co' : 'Yes') : 'No';
    if (Array.isArray(value)) return value.length === 0 ? '[]' : value.join(', ');
    if (isPlainObject(value)) {
      return value.name || value.fullName || value.roomNumber || value.email || value.id || JSON.stringify(value);
    }
    return String(value);
  };

  const hasDifferentValue = (beforeValue, afterValue) => (
    JSON.stringify(beforeValue) !== JSON.stringify(afterValue)
  );

  const getMessageFields = (message) => {
    if (!message) return [];
    const before = message.before;
    const after = message.after;

    if (isPlainObject(before) && isPlainObject(after)) {
      return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
        .filter((field) => hasDifferentValue(before[field], after[field]))
        .map((field) => ({ field, before: before[field], after: after[field] }));
    }

    const source = isPlainObject(after) ? after : isPlainObject(message) ? message : {};
    return Object.entries(source).map(([field, value]) => ({ field, before: undefined, after: value }));
  };

  const renderMessageSummary = (log) => {
    const messageFields = getMessageFields(log.message);
    if (messageFields.length === 0) {
      return <span className="text-xs text-slate-400">{isVi ? 'Khong co du lieu' : 'No details'}</span>;
    }

    return (
      <div className="flex max-w-[360px] flex-wrap items-center gap-1.5">
        {messageFields.slice(0, 3).map(({ field, before, after }) => (
          <span
            key={field}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
            title={`${formatFieldName(field)}: ${formatMessageValue(before)} -> ${formatMessageValue(after)}`}
          >
            <span className="font-semibold text-slate-500">{formatFieldName(field)}</span>
            <span className="truncate text-slate-800">{formatMessageValue(after)}</span>
          </span>
        ))}
        {messageFields.length > 3 && (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
            +{messageFields.length - 3}
          </span>
        )}
        <button
          type="button"
          onClick={() => setSelectedLog(log)}
          className="inline-flex items-center gap-1 rounded-md border border-[#bfa15f]/30 bg-[#bfa15f]/10 px-2 py-1 text-[11px] font-bold text-[#8a6f32] hover:bg-[#bfa15f]/15"
        >
          <Eye size={12} />
          {isVi ? 'Chi tiet' : 'Details'}
        </button>
      </div>
    );
  };

  const renderStatus = (status) => {
    const success = status === 'SUCCESS';
    const Icon = success ? CheckCircle2 : AlertTriangle;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        success
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
          : 'bg-red-50 text-red-700 ring-1 ring-red-100'
      }`}>
        <Icon size={13} />
        {isVi ? (success ? 'Thành công' : 'Thất bại') : status}
      </span>
    );
  };

  const renderFilterSelect = (label, labelEn, value, field, options, translationMap) => (
    <label className="min-w-0 space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{isVi ? label : labelEn}</span>
      <select
        value={value}
        onChange={(event) => handleFilterChange(field, event.target.value)}
        className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {translationMap?.[option]?.[locale] || option || (isVi ? 'Tất cả' : 'All')}
          </option>
        ))}
      </select>
    </label>
  );

  const renderDetailModal = () => {
    const messageFields = selectedLog ? getMessageFields(selectedLog.message) : [];
    const rawJson = selectedLog ? JSON.stringify(selectedLog.message, null, 2) : '';

    return (
      <Modal
        open={Boolean(selectedLog)}
        title={selectedLog ? `${selectedLog.action} #${selectedLog.id}` : 'Audit Log'}
        onClose={() => setSelectedLog(null)}
        size="2xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <InfoTile
                icon={CheckCircle2}
                label={isVi ? 'Trạng thái' : 'Status'}
                value={isVi && STATUS_LABELS[selectedLog.status] ? STATUS_LABELS[selectedLog.status].vi : selectedLog.status}
                tone={selectedLog.status === 'SUCCESS' ? 'green' : 'red'}
              />
              <InfoTile
                icon={Database}
                label={isVi ? 'Phân hệ' : 'Module'}
                value={isVi && MODULE_LABELS[selectedLog.module] ? MODULE_LABELS[selectedLog.module].vi : selectedLog.module}
              />
              <InfoTile
                icon={UserRound}
                label={isVi ? 'Người thực hiện' : 'Actor'}
                value={selectedLog.actorUsername || selectedLog.actorEmail || '-'}
              />
              <InfoTile
                icon={Clock}
                label={isVi ? 'Thời gian' : 'Time'}
                value={formatTime(selectedLog.createdAt)}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <div className="flex flex-col gap-2 border-b border-stone-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <FileJson size={16} className="text-[#bfa15f]" />
                  {isVi ? 'Chi tiết thông báo' : 'Message details'}
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  {messageFields.length} {isVi ? 'trường dữ liệu' : 'fields'}
                </div>
              </div>
              <div className="max-h-[46vh] overflow-auto">
                {messageFields.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">
                    {isVi ? 'Không có chi tiết thông báo.' : 'No message details.'}
                  </div>
                ) : (
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-stone-200 bg-white text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="w-[190px] px-4 py-3 text-left font-bold">{isVi ? 'Trường' : 'Field'}</th>
                        <th className="px-4 py-3 text-left font-bold">{isVi ? 'Trước' : 'Before'}</th>
                        <th className="px-4 py-3 text-left font-bold">{isVi ? 'Sau' : 'After'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {messageFields.map(({ field, before, after }) => (
                        <tr key={field} className="align-top hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-bold text-slate-700">{formatFieldName(field)}</td>
                          <td className="px-4 py-3">
                            <div className="min-h-10 rounded-lg border border-stone-200 bg-slate-50 px-3 py-2 text-slate-600 break-words">
                              {formatMessageValue(before)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="min-h-10 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 font-semibold text-slate-900 break-words">
                              {formatMessageValue(after)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <details className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-100">
                {isVi ? 'Xem JSON gốc' : 'View raw JSON'}
              </summary>
              <pre className="max-h-64 overflow-auto border-t border-white/10 p-4 text-xs leading-relaxed text-slate-100">
                {rawJson}
              </pre>
            </details>
          </div>
        )}
      </Modal>
    );
  };

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />
      {renderDetailModal()}

      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-[#bfa15f] shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{isVi ? 'Nhật ký hệ thống' : 'Audit Log'}</h2>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#bfa15f]/10 px-2.5 py-1 text-xs font-bold text-[#8a6f32]">
                  {activeFilterCount} {isVi ? 'bộ lọc' : 'filters'}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {isVi ? 'Theo dõi thao tác và thông báo trong hệ thống.' : 'Track actions and messages in the system.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
          <StatTile label={isVi ? 'Trang này' : 'This page'} value={pageStats.total} tone="slate" />
          <StatTile label={isVi ? 'Thành công' : 'Success'} value={pageStats.success} tone="green" />
          <StatTile label={isVi ? 'Thất bại' : 'Failed'} value={pageStats.failed} tone="red" />
        </div>
      </div>

      <form onSubmit={handleSearch} className="rounded-xl border border-stone-200 bg-slate-50/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Filter size={16} className="text-[#bfa15f]" />
            {isVi ? 'Bộ lọc nhật ký' : 'Audit filters'}
          </div>
          <button
            type="button"
            onClick={() => loadLogs()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 text-xs font-bold text-slate-600 hover:bg-stone-50"
          >
            <RefreshCw size={13} />
            {isVi ? 'Tải lại' : 'Reload'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{isVi ? 'Hành động' : 'Action'}</span>
            <input
              value={filters.action}
              onChange={(event) => handleFilterChange('action', event.target.value)}
              placeholder="LOGIN_SUCCESS"
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
            />
          </label>

          {renderFilterSelect('Phân hệ', 'Module', filters.module, 'module', MODULE_OPTIONS, MODULE_LABELS)}

          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{isVi ? 'ID Người thực hiện' : 'Actor ID'}</span>
            <input
              type="number"
              min="1"
              value={filters.actorUserId}
              onChange={(event) => handleFilterChange('actorUserId', event.target.value)}
              placeholder="1"
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
            />
          </label>

          {renderFilterSelect('Trạng thái', 'Status', filters.status, 'status', STATUS_OPTIONS, STATUS_LABELS)}

          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{isVi ? 'Từ ngày' : 'From'}</span>
            <input
              type="datetime-local"
              value={filters.fromTime}
              onChange={(event) => handleFilterChange('fromTime', event.target.value)}
              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#bfa15f] focus:ring-2 focus:ring-[#bfa15f]/15"
            />
          </label>

          <label className="min-w-0 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{isVi ? 'Đến ngày' : 'To'}</span>
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
            {isVi ? 'Xóa lọc' : 'Clear'}
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
          >
            <Search size={15} />
            {isVi ? 'Lọc dữ liệu' : 'Filter logs'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="border-b border-stone-200 bg-white text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-bold">ID</th>
                <th className="px-4 py-3 text-left font-bold">{isVi ? 'Thời gian' : 'Time'}</th>
                <th className="px-4 py-3 text-left font-bold">{isVi ? 'Hành động' : 'Action'}</th>
                <th className="px-4 py-3 text-left font-bold">{isVi ? 'Trạng thái' : 'Status'}</th>
                <th className="px-4 py-3 text-left font-bold">{isVi ? 'Người thực hiện' : 'Actor'}</th>
                <th className="px-4 py-3 text-left font-bold">{isVi ? 'Thông báo' : 'Message'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#bfa15f] border-t-transparent" />
                    {isVi ? 'Đang tải nhật ký...' : 'Loading audit logs...'}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-slate-400">
                    {isVi ? 'Chưa có nhật ký phù hợp.' : 'No matching audit logs.'}
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">#{log.id}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatTime(log.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="font-mono text-xs font-bold text-slate-800">{log.action}</div>
                    <div className="mt-1 text-[11px] font-semibold uppercase text-slate-400">
                      {isVi && MODULE_LABELS[log.module] ? MODULE_LABELS[log.module].vi : log.module}
                    </div>
                  </td>
                  <td className="px-4 py-4">{renderStatus(log.status)}</td>
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
            {isVi ? 'Trang' : 'Page'} <strong>{page + 1}</strong> / {Math.max(totalPages, 1)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={page === 0}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isVi ? 'Trước' : 'Previous'}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, Math.max(totalPages - 1, 0)))}
              disabled={page >= totalPages - 1}
              className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isVi ? 'Sau' : 'Next'}
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

function InfoTile({ icon: Icon, label, value, tone = 'slate' }) {
  const toneClass = {
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    red: 'border-red-100 bg-red-50 text-red-700',
    slate: 'border-stone-200 bg-slate-50 text-slate-800',
  }[tone] || 'border-stone-200 bg-slate-50 text-slate-800';

  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide opacity-70">
        {Icon && <Icon size={13} />}
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-bold" title={String(value)}>{value}</div>
    </div>
  );
}

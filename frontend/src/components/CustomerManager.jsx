import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  forceDeleteCustomer,
} from '../services/customerService';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động', color: 'bg-stone-100 text-stone-600' },
  { value: 'BANNED', label: 'Bị cấm', color: 'bg-red-100 text-red-700' },
];

const ID_TYPES = ['CCCD', 'PASSPORT', 'OTHER'];

const EMPTY = {
  fullName: '',
  email: '',
  phone: '',
  idType: 'CCCD',
  idNumberCard: '',
  nationality: 'Việt Nam',
};

export default function CustomerManager() {
  const { hasRole } = useAuth();
  const { locale, t } = useLocale();
  const canDelete = hasRole('ADMIN', 'MANAGER');
  const canEdit = hasRole('ADMIN', 'MANAGER', 'RECEPTIONIST');
  const canCreate = hasRole('ADMIN', 'MANAGER', 'RECEPTIONIST');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await getCustomers({
        page: p,
        size: 10,
        status: statusFilter,
        keywords: search || undefined,
      }, locale);
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message || t('customer.toast.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, locale]);

  useEffect(() => {
    fetchData(page);
  }, [page, statusFilter, fetchData]);

  const openCreate = () => {
    if (!canCreate) return notify(t('customer.toast.forbidden'), 'error');
    setForm(EMPTY);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    if (!canEdit) return notify(t('customer.toast.forbidden'), 'error');
    setForm({
      fullName: item.fullName || '',
      email: item.email || '',
      phone: item.phone || '',
      idType: item.idType || 'CCCD',
      idNumberCard: item.idNumberCard || item.idCard || '',
      nationality: item.nationality || 'Việt Nam',
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        idType: form.idType,
        idNumberCard: form.idNumberCard.trim(),
        nationality: form.nationality.trim(),
      };

      if (modal.editing) {
        await updateCustomer(modal.editing.id, payload, locale);
        notify(t('customer.toast.updateSuccess'));
      } else {
        await createCustomer(payload, locale);
        notify(t('customer.toast.addSuccess'));
      }
      closeModal();
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('customer.toast.forbidden') : (e.message || t('customer.toast.generalError')), 'error');
    } finally {
      setSaving(false);
    }
  };

  const [confirmId, setConfirmId] = useState(null);

  const handleDelete = async (item) => {
    if (!canDelete) return notify(t('customer.toast.forbiddenDelete'), 'error');
    if (confirmId !== item.id) {
      setConfirmId(item.id);
      return;
    }
    setConfirmId(null);
    try {
      await deleteCustomer(item.id, locale);
      notify(t('customer.toast.deleteSuccess'));
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('customer.toast.forbiddenDelete') : (e.message || t('customer.toast.generalError')), 'error');
    }
  };

  const handleRestore = async (item) => {
    if (!canDelete) return notify(t('customer.toast.forbiddenRestore'), 'error');
    try {
      await restoreCustomer(item.id, locale);
      notify(t('customer.toast.restoreSuccess'));
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('customer.toast.forbiddenRestore') : (e.message || t('customer.toast.generalError')), 'error');
    }
  };

  const handleForceDelete = async (item) => {
    if (!canDelete) return notify(t('customer.toast.forbiddenForceDelete'), 'error');
    setConfirmId(null);
    try {
      await forceDeleteCustomer(item.id, locale);
      notify(t('customer.toast.forceDeleteSuccess'));
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('customer.toast.forbiddenForceDelete') : (e.message || t('customer.toast.generalError')), 'error');
    }
  };


  const getStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    const label = status === 'ACTIVE' ? t('customer.status.active') : status === 'INACTIVE' ? t('customer.status.inactive') : t('customer.status.banned');
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${opt.color}`}>{label}</span>;
  };

  const rows = items.map(item => (
    <tr key={item.id} className="hover:bg-stone-50">
      <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
      <td className="px-4 py-3 font-semibold">{item.fullName}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{item.email || '-'}</td>
      <td className="px-4 py-3 text-xs">{item.phone || '-'}</td>
      <td className="px-4 py-3 text-xs">{item.idCard || item.idNumberCard || '-'}</td>
      <td className="px-4 py-3 text-xs">{item.nationality || '-'}</td>
      <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {canEdit && confirmId !== item.id && (
            <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Chỉnh sửa">
              <Edit2 size={15} />
            </button>
          )}
          {canDelete && (
            confirmId === item.id ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => item.status === 'ACTIVE' ? handleDelete(item) : handleForceDelete(item)}
                  className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                  title={item.status === 'ACTIVE' ? t('customer.actions.titleDelete') : t('customer.actions.titleForceDelete')}
                >
                  {item.status === 'ACTIVE' ? t('customer.actions.confirmDelete') : t('customer.actions.confirmForceDelete')}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-[10px] px-2 py-0.5 border border-stone-300 rounded hover:bg-stone-100 text-slate-600"
                >
                  {t('customer.actions.cancel')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {item.status === 'ACTIVE' ? (
                  <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" title={t('customer.actions.delete')}>
                    <Trash2 size={15} />
                  </button>
                ) : (
                  <>
                    <button onClick={() => handleRestore(item)} className="text-emerald-500 hover:text-emerald-700 font-bold" title={t('customer.actions.restore')}>
                      <RefreshCw size={15} />
                    </button>
                    <button onClick={() => setConfirmId(item.id)} className="text-red-500 hover:text-red-700" title={t('customer.actions.forceDelete')}>
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            )
          )}
        </div>
      </td>
    </tr>
  ));

  const cols = [t('customer.columns.id'), t('customer.columns.fullName'), t('customer.columns.email'), t('customer.columns.phone'), t('customer.columns.idCard'), t('customer.columns.nationality'), t('customer.columns.status'), t('customer.columns.actions')];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData(0)}
              placeholder={t('customer.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:border-[#bfa15f] outline-none" />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
          >
            {STATUS_OPTIONS.map(opt => {
              const label = opt.value === 'ACTIVE' ? t('customer.status.active') : opt.value === 'INACTIVE' ? t('customer.status.inactive') : t('customer.status.banned');
              return <option key={opt.value} value={opt.value}>{label}</option>;
            })}
          </select>

          <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100">
            <RefreshCw size={14} />
          </button>
        </div>

        {canCreate && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow transition-colors">
            <Plus size={16} /> {t('customer.addBtn')}
          </button>
        )}
      </div>

      <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modal.open} title={modal.editing ? t('customer.modal.editTitle') : t('customer.modal.addTitle')} onClose={closeModal}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.fullName')}</label>
            <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.email')}</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.phone')}</label>
              <input required pattern="^0[0-9]{9}$" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.idType')}</label>
              <select required value={form.idType} onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.idNumber')}</label>
              <input required pattern="^[A-Za-z0-9\\-]{6,20}$" value={form.idNumberCard} onChange={e => setForm(f => ({ ...f, idNumberCard: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.nationality')}</label>
            <input required value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t('customer.modal.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? t('customer.modal.saving') : modal.editing ? t('customer.modal.update') : t('customer.modal.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

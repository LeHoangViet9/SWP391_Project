import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { usePermission } from '../hooks/usePermission';
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
  const { hasPermission } = usePermission();
  const { locale, t } = useLocale();
  const canDelete = hasPermission('CUSTOMER_DELETE');
  const canEdit = hasPermission('CUSTOMER_UPDATE');
  const canCreate = hasPermission('CUSTOMER_CREATE');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchOpt, setSearchOpt] = useState('fullName');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let err = '';
    const trimmed = value ? value.trim() : '';
    if (name === 'fullName') {
      if (!trimmed) {
        err = locale === 'vi' ? 'Họ và tên không được chỉ chứa khoảng trắng!' : 'Full name cannot be empty or only spaces!';
      } else if (/^\s|\s$/.test(value)) {
        err = locale === 'vi' ? 'Họ và tên không được chứa khoảng trắng ở đầu hoặc cuối!' : 'Full name cannot have leading or trailing spaces!';
      } else if (/\s{2,}/.test(value)) {
        err = locale === 'vi' ? 'Họ và tên không được chứa nhiều khoảng trắng liên tiếp!' : 'Full name cannot have consecutive spaces!';
      }
    } else if (name === 'email') {
      if (!trimmed) {
        err = locale === 'vi' ? 'Email không được chỉ chứa khoảng trắng!' : 'Email cannot be empty or only spaces!';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        err = locale === 'vi' ? 'Email không hợp lệ!' : 'Invalid email format!';
      }
    } else if (name === 'phone') {
      if (!trimmed) {
        err = locale === 'vi' ? 'Số điện thoại không được chỉ chứa khoảng trắng!' : 'Phone number cannot be empty or only spaces!';
      } else if (!/^0[0-9]{9}$/.test(trimmed)) {
        err = locale === 'vi' ? 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số!' : 'Phone number must start with 0 and have 10 digits!';
      }
    } else if (name === 'idNumberCard') {
      if (!trimmed) {
        err = locale === 'vi' ? 'Số giấy tờ không được chỉ chứa khoảng trắng!' : 'ID card number cannot be empty or only spaces!';
      } else if (!/^[A-Za-z0-9\-]{6,20}$/.test(trimmed)) {
        err = locale === 'vi' ? 'Số giấy tờ phải từ 6-20 ký tự!' : 'ID card number must be 6-20 characters!';
      }
    } else if (name === 'nationality') {
      if (!trimmed) {
        err = locale === 'vi' ? 'Quốc tịch không được chỉ chứa khoảng trắng!' : 'Nationality cannot be empty or only spaces!';
      }
    }
    setErrors(prev => ({ ...prev, [name]: err }));
    return err;
  };

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchDataDirect = useCallback(async (p, opt, val, statusVal = statusFilter) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10, status: statusVal };
      const trimmed = val ? String(val).trim() : '';
      if (trimmed) {
        params.keyword = trimmed;
      }
      const res = await getCustomers(params, locale);
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message || t('customer.toast.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [locale, t, statusFilter]);

  const fetchData = useCallback(async (p = page) => {
    await fetchDataDirect(p, searchOpt, search, statusFilter);
  }, [page, searchOpt, search, statusFilter, fetchDataDirect]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(page);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter, fetchData]);

  const openCreate = () => {
    if (!canCreate) return notify(t('customer.toast.forbidden'), 'error');
    setForm(EMPTY);
    setErrors({});
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
    setErrors({});
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (e) => {
    e.preventDefault();
    
    const errFullName = validateField('fullName', form.fullName);
    const errEmail = validateField('email', form.email);
    const errPhone = validateField('phone', form.phone);
    const errIdNumberCard = validateField('idNumberCard', form.idNumberCard);
    const errNationality = validateField('nationality', form.nationality);

    if (errFullName || errEmail || errPhone || errIdNumberCard || errNationality) {
      notify(locale === 'vi' ? 'Vui lòng sửa các trường thông tin bị lỗi!' : 'Please fix the invalid fields!', 'error');
      return;
    }

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
          <select
            value={searchOpt}
            onChange={e => {
              setSearchOpt(e.target.value);
              setSearch('');
              fetchDataDirect(0, e.target.value, '', statusFilter);
            }}
            className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white font-medium text-slate-700"
          >
            <option value="fullName">{t('customer.searchOptions.fullName') || 'Họ và tên'}</option>
            <option value="id">{t('customer.searchOptions.id') || 'Mã (ID)'}</option>
            <option value="email">{t('customer.searchOptions.email') || 'Email'}</option>
            <option value="phone">{t('customer.searchOptions.phone') || 'Số điện thoại'}</option>
            <option value="idNumberCard">{t('customer.searchOptions.idNumberCard') || 'Số giấy tờ'}</option>
            <option value="nationality">{t('customer.searchOptions.nationality') || 'Quốc tịch'}</option>
          </select>

          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={searchOpt === 'id' ? 'number' : 'text'}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(0); // Reset page khi gõ tìm kiếm
              }}
              onKeyDown={e => e.key === 'Enter' && fetchData(0)}
              placeholder={
                searchOpt === 'id' ? (t('customer.placeholders.id') || 'Nhập mã ID...') :
                searchOpt === 'fullName' ? (t('customer.placeholders.fullName') || 'Nhập họ và tên...') :
                searchOpt === 'email' ? (t('customer.placeholders.email') || 'Nhập email...') :
                searchOpt === 'phone' ? (t('customer.placeholders.phone') || 'Nhập số điện thoại...') :
                searchOpt === 'idNumberCard' ? (t('customer.placeholders.idNumberCard') || 'Nhập số giấy tờ...') :
                searchOpt === 'nationality' ? (t('customer.placeholders.nationality') || 'Nhập quốc tịch...') :
                (t('customer.searchPlaceholder') || 'Tìm kiếm...')
              }
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:border-[#bfa15f] outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(0); // Reset page khi đổi trạng thái
            }}
            className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white font-medium text-slate-700"
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
            <input required value={form.fullName}
              onChange={e => {
                setForm(f => ({ ...f, fullName: e.target.value }));
                if (errors.fullName) validateField('fullName', e.target.value);
              }}
              onBlur={e => validateField('fullName', e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`} />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.email')}</label>
              <input required type="email" value={form.email}
                onChange={e => {
                  setForm(f => ({ ...f, email: e.target.value }));
                  if (errors.email) validateField('email', e.target.value);
                }}
                onBlur={e => validateField('email', e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.phone')}</label>
              <input required value={form.phone}
                onChange={e => {
                  setForm(f => ({ ...f, phone: e.target.value }));
                  if (errors.phone) validateField('phone', e.target.value);
                }}
                onBlur={e => validateField('phone', e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.idType')}</label>
              <select required value={form.idType} onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white font-medium text-slate-700">
                {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.idNumber')}</label>
              <input required value={form.idNumberCard}
                onChange={e => {
                  setForm(f => ({ ...f, idNumberCard: e.target.value }));
                  if (errors.idNumberCard) validateField('idNumberCard', e.target.value);
                }}
                onBlur={e => validateField('idNumberCard', e.target.value)}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.idNumberCard ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`} />
              {errors.idNumberCard && <p className="text-red-500 text-xs mt-1">{errors.idNumberCard}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('customer.modal.nationality')}</label>
            <input required value={form.nationality}
              onChange={e => {
                setForm(f => ({ ...f, nationality: e.target.value }));
                if (errors.nationality) validateField('nationality', e.target.value);
              }}
              onBlur={e => validateField('nationality', e.target.value)}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.nationality ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:border-[#bfa15f] focus:ring-[#bfa15f]'}`} />
            {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
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

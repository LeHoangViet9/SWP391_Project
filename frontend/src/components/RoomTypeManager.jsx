import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import { apiFetch } from '../services/api';
import DataTable from './shared/DataTable';
import { useLocale } from '../context/LocaleContext';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const EMPTY = { typeName: '', description: '', basePrice: '', maxGuests: '' };

export default function RoomTypeManager({ readOnly = false }) {
  const { locale, t } = useLocale();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchOpt, setSearchOpt] = useState('typeName');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: p, size: 10 });
      if (search.trim()) {
        if (searchOpt === 'id') {
          q.set('id', search.trim());
        } else if (searchOpt === 'typeName') {
          q.set('typeName', search.trim());
        } else if (searchOpt === 'basePrice') {
          q.set('price', search.trim());
        } else if (searchOpt === 'maxGuests') {
          q.set('maxGuests', search.trim());
        }
      }
      const res = await apiFetch(`/room-types?${q}`, {}, locale);
      const content = res?.data?.content ?? [];
      setItems(content);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message || t('roomType.toast.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, searchOpt, page]);

  useEffect(() => { fetchData(page); }, [page]);

  const openCreate = () => { setForm(EMPTY); setModal({ open: true, editing: null }); };
  const openEdit = (item) => {
    setForm({ typeName: item.typeName, description: item.description || '', basePrice: item.basePrice, maxGuests: item.maxGuests });
    setModal({ open: true, editing: item });
  };
  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const name = form.typeName?.trim();
    if (!name) {
      notify(locale === 'vi' ? 'Tên loại phòng không được để trống!' : 'Room type name cannot be blank!', 'error');
      setSaving(false);
      return;
    }
    const basePrice = Number(form.basePrice);
    if (isNaN(basePrice) || basePrice <= 0 || !Number.isInteger(basePrice)) {
      notify(locale === 'vi' ? 'Giá cơ bản phải là số nguyên dương!' : 'Base price must be a positive integer!', 'error');
      setSaving(false);
      return;
    }
    if (basePrice > 2147483647) {
      notify(locale === 'vi' ? 'Giá cơ bản không được vượt quá 2.147.483.647!' : 'Base price must not exceed 2147483647!', 'error');
      setSaving(false);
      return;
    }
    const maxGuests = Number(form.maxGuests);
    if (isNaN(maxGuests) || maxGuests < 1 || maxGuests > 20 || !Number.isInteger(maxGuests)) {
      notify(locale === 'vi' ? 'Số khách tối đa phải là số nguyên từ 1 đến 20!' : 'Maximum guests must be an integer between 1 and 20!', 'error');
      setSaving(false);
      return;
    }
    if (form.description && form.description.length > 255) {
      notify(locale === 'vi' ? 'Ghi chú không được vượt quá 255 ký tự!' : 'Description must not exceed 255 characters!', 'error');
      setSaving(false);
      return;
    }

    const payload = { typeName: name, description: form.description, basePrice, maxGuests };
    try {
      if (modal.editing) {
        const res = await apiFetch(`/room-types/${modal.editing.id}`, { method: 'PUT', body: JSON.stringify(payload) }, locale);
        notify(res?.message || t('roomType.toast.updateSuccess'));
      } else {
        const res = await apiFetch('/room-types', { method: 'POST', body: JSON.stringify(payload) }, locale);
        notify(res?.message || t('roomType.toast.addSuccess'));
      }
      closeModal();
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? '403 Forbidden — Bạn không có quyền thực hiện thao tác này!' : e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa loại phòng "${item.typeName}"?`)) return;
    try {
      const res = await apiFetch(`/room-types/${item.id}`, { method: 'DELETE' });
      notify(res?.message || 'Đã xóa!');
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? '403 Forbidden — Bạn không có quyền xóa!' : e.message, 'error');
    }
  };

  const rows = items.map(item => (
    <tr key={item.id} className="hover:bg-stone-50">
      <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
      <td className="px-4 py-3 font-semibold">{item.typeName}</td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{item.description || '-'}</td>
      <td className="px-4 py-3 text-[#bfa15f] font-bold">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.basePrice)}
      </td>
      <td className="px-4 py-3 text-center">{item.maxGuests}</td>
      {!readOnly && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit2 size={15} /></button>
            <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
          </div>
        </td>
      )}
    </tr>
  ));

  const cols = [t('roomType.columns.id'), t('roomType.columns.name'), t('roomType.columns.description'), t('roomType.columns.basePrice'), t('roomType.columns.maxGuests'), ...(!readOnly ? [t('roomType.columns.actions')] : [])];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <select
            value={searchOpt}
            onChange={e => {
              setSearchOpt(e.target.value);
              setSearch('');
            }}
            className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white font-medium text-slate-700"
          >
            <option value="typeName">{t('roomType.searchOptions.name') || 'Tên loại phòng'}</option>
            <option value="id">{t('roomType.searchOptions.id') || 'Mã (ID)'}</option>
            <option value="basePrice">{t('roomType.searchOptions.price') || 'Giá tối đa (VND)'}</option>
            <option value="maxGuests">{t('roomType.searchOptions.maxGuests') || 'Số khách tối thiểu'}</option>
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={searchOpt === 'id' || searchOpt === 'basePrice' || searchOpt === 'maxGuests' ? 'number' : 'text'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData(0)}
              placeholder={
                searchOpt === 'id' ? (t('roomType.placeholders.id') || 'Nhập mã ID...') :
                searchOpt === 'basePrice' ? (t('roomType.placeholders.price') || 'Nhập giá tối đa...') :
                searchOpt === 'maxGuests' ? (t('roomType.placeholders.maxGuests') || 'Nhập số khách tối thiểu...') :
                (t('roomType.placeholders.name') || t('roomType.searchPlaceholder') || 'Nhập tên loại phòng...')
              }
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:border-[#bfa15f] outline-none"
            />
          </div>
          <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100"><RefreshCw size={14} /></button>
        </div>
        {!readOnly && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow transition-colors">
            <Plus size={16} /> {t('roomType.addBtn')}
          </button>
        )}
      </div>

      <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal Form */}
      <Modal open={modal.open} title={modal.editing ? t('roomType.modal.editTitle') : t('roomType.modal.addTitle')} onClose={closeModal}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('roomType.modal.name')}</label>
            <input required value={form.typeName} onChange={e => setForm(f => ({ ...f, typeName: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder="Ví dụ: Deluxe Suite" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('roomType.modal.basePrice')}</label>
              <input required type="number" min="0" max="2147483647" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder="1200000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('roomType.modal.maxGuests')}</label>
              <input required type="number" min="1" max="20" value={form.maxGuests} onChange={e => setForm(f => ({ ...f, maxGuests: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder="2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('roomType.modal.description')}</label>
            <textarea rows={3} value={form.description} maxLength={255} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" placeholder="Mô tả tiện nghi, tầm nhìn..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t('roomType.modal.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? t('roomType.modal.saving') : modal.editing ? t('roomType.modal.update') : t('roomType.modal.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

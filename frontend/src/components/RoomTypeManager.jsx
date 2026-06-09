import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import { apiFetch } from '../services/api';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const EMPTY = { typeName: '', description: '', basePrice: '', maxGuests: '' };

export default function RoomTypeManager({ readOnly = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
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
      if (search) q.set('keywords', search);
      const res = await apiFetch(`/room-types?${q}`);
      const content = res?.data?.content ?? [];
      setItems(content);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

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
    const payload = { typeName: form.typeName, description: form.description, basePrice: Number(form.basePrice), maxGuests: Number(form.maxGuests) };
    try {
      if (modal.editing) {
        const res = await apiFetch(`/room-types/${modal.editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify(res?.message || 'Cập nhật thành công!');
      } else {
        const res = await apiFetch('/room-types', { method: 'POST', body: JSON.stringify(payload) });
        notify(res?.message || 'Tạo mới thành công!');
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

  const cols = ['ID', 'Tên Loại Phòng', 'Mô Tả', 'Giá Cơ Bản', 'Khách tối đa', ...(!readOnly ? ['Thao tác'] : [])];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData(0)}
              placeholder="Tìm kiếm..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:border-[#bfa15f] outline-none"
            />
          </div>
          <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100"><RefreshCw size={14} /></button>
        </div>
        {!readOnly && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow transition-colors">
            <Plus size={16} /> Thêm mới
          </button>
        )}
      </div>

      <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal Form */}
      <Modal open={modal.open} title={modal.editing ? 'Cập Nhật Loại Phòng' : 'Thêm Loại Phòng'} onClose={closeModal}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Tên Loại Phòng *</label>
            <input required value={form.typeName} onChange={e => setForm(f => ({ ...f, typeName: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder="Ví dụ: Deluxe Suite" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Giá Cơ Bản (VND) *</label>
              <input required type="number" min="0" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder="1200000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Sức Chứa Tối Đa *</label>
              <input required type="number" min="1" value={form.maxGuests} onChange={e => setForm(f => ({ ...f, maxGuests: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder="2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Mô Tả</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" placeholder="Mô tả tiện nghi, tầm nhìn..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">Hủy</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

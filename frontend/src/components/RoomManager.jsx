import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import {
  getAllRooms,
  getRoomTypes,
  createRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
} from '../services/roomService';
import DataTable from './shared/DataTable';
import { useLocale } from '../context/LocaleContext';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OCCUPIED: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = { roomTypeId: '', floorNumber: '', description: '' };

function getRoomStatus(item) {
  return item.roomStatus || item.status || 'AVAILABLE';
}

function getRoomTypeId(item) {
  return item.roomTypeId || item.roomType?.id || '';
}

export default function RoomManager({ readOnly = false }) {
  const { locale, t } = useLocale();
  const [items, setItems] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await getAllRooms({ page: p, size: 10, keywords: search || undefined }, locale);
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message || t('room.toast.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchData(page); }, [page, fetchData]);

  useEffect(() => {
    getRoomTypes({ page: 0, size: 100 }, locale)
      .then(res => setRoomTypes(res?.data?.content ?? []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFile(null);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    setForm({
      roomTypeId: getRoomTypeId(item),
      floorNumber: item.floorNumber || '',
      description: item.description || '',
    });
    setFile(null);
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modal.editing && !file) return notify(t('room.toast.imageRequired'), 'warning');

    const payload = {
      roomTypeId: Number(form.roomTypeId),
      floorNumber: Number(form.floorNumber),
      description: form.description,
    };

    setSaving(true);
    try {
      if (modal.editing) {
        await updateRoom(modal.editing.id, payload, file, locale);
        notify(t('room.toast.updateSuccess'));
      } else {
        await createRoom(payload, file, locale);
        notify(t('room.toast.addSuccess'));
      }
      closeModal();
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('room.toast.forbidden') : e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t('room.toast.deleteConfirm').replace('{roomNumber}', item.roomNumber))) return;
    try {
      await deleteRoom(item.id, locale);
      notify(t('room.toast.deleteSuccess'));
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('room.toast.forbiddenDelete') : e.message, 'error');
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      await updateRoomStatus(item.id, newStatus, locale);
      notify(t('room.toast.statusSuccess'));
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('room.toast.forbidden') : e.message, 'error');
    }
  };

  const rows = items.map(item => {
    const status = getRoomStatus(item);
    const displayStatus = status === 'AVAILABLE' ? t('room.status.available') : status === 'OCCUPIED' ? t('room.status.occupied') : status === 'MAINTENANCE' ? t('room.status.maintenance') : t('room.status.inactive');
    return (
      <tr key={item.id} className="hover:bg-stone-50">
        <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
        <td className="px-4 py-3 font-bold">{item.roomNumber}</td>
        <td className="px-4 py-3 text-xs text-slate-500">
          {item.roomTypeName || item.roomType?.typeName || '-'}
        </td>
        <td className="px-4 py-3 text-center">{item.floorNumber}</td>
        <td className="px-4 py-3">
          {readOnly ? (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-600'}`}>
              {displayStatus}
            </span>
          ) : (
            <select
              value={status}
              onChange={e => handleStatusChange(item, e.target.value)}
              className={`text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[status] || 'bg-stone-100'}`}
            >
              {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE'].map(s => {
                const label = s === 'AVAILABLE' ? t('room.status.available') : s === 'OCCUPIED' ? t('room.status.occupied') : s === 'MAINTENANCE' ? t('room.status.maintenance') : t('room.status.inactive');
                return <option key={s} value={s}>{label}</option>;
              })}
            </select>
          )}
        </td>
        <td className="px-4 py-3">
          {item.imageRoom ? (
            <img src={item.imageRoom} alt="room" className="w-12 h-10 object-cover rounded border" />
          ) : (
            <span className="text-xs text-slate-400">{t('room.noImage')}</span>
          )}
        </td>
        {!readOnly && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title={locale === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" title={locale === 'vi' ? 'Xóa' : 'Delete'}>
                <Trash2 size={15} />
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  });

  const cols = [t('room.columns.id'), t('room.columns.roomNumber'), t('room.columns.roomType'), t('room.columns.floor'), t('room.columns.status'), t('room.columns.image'), ...(!readOnly ? [t('room.columns.actions')] : [])];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData(0)}
              placeholder={t('room.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:border-[#bfa15f] outline-none"
            />
          </div>
          <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100">
            <RefreshCw size={14} />
          </button>
        </div>
        {!readOnly && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow">
            <Plus size={16} /> {t('room.addBtn')}
          </button>
        )}
      </div>

      <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modal.open} title={modal.editing ? t('room.modal.editTitle') : t('room.modal.addTitle')} onClose={closeModal}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('room.modal.floor')}</label>
              <input required type="number" min="1" value={form.floorNumber} onChange={e => setForm(f => ({ ...f, floorNumber: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder="1" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('room.modal.roomType')}</label>
              <select required value={form.roomTypeId} onChange={e => setForm(f => ({ ...f, roomTypeId: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                <option value="">{t('room.modal.selectType')}</option>
                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.typeName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              {modal.editing ? t('room.modal.imageNew') : t('room.modal.imageReq')}
            </label>
            <input type="file" accept="image/*" required={!modal.editing} onChange={e => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:bg-[#bfa15f] file:text-white file:rounded file:text-xs file:cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('room.modal.description')}</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t('room.modal.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? t('room.modal.saving') : modal.editing ? t('room.modal.update') : t('room.modal.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

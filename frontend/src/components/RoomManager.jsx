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
import { usePermission } from '../hooks/usePermission';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
  READY: 'bg-cyan-100 text-cyan-700 border border-cyan-300',
  RESERVED: 'bg-amber-100 text-amber-700 border border-amber-300',
  OCCUPIED: 'bg-red-100 text-red-700 border border-red-300',
  CLEANING: 'bg-violet-100 text-violet-700 border border-violet-300',
  DIRTY: 'bg-orange-100 text-orange-700 border border-orange-300',
  MAINTENANCE: 'bg-slate-200 text-slate-700 border border-slate-400',
  CHECKOUT_PENDING: 'bg-pink-100 text-pink-700 border border-pink-300',
  INACTIVE: 'bg-stone-100 text-stone-700 border border-stone-300',
};

const STATUS_LABELS = {
  vi: {
    AVAILABLE: 'Phòng trống',
    READY: 'Sẵn sàng',
    RESERVED: 'Đã đặt',
    OCCUPIED: 'Đang ở',
    CLEANING: 'Đang dọn',
    DIRTY: 'Chờ dọn',
    MAINTENANCE: 'Bảo trì',
    CHECKOUT_PENDING: 'Chờ trả phòng',
    INACTIVE: 'Ngừng hoạt động',
  },
  en: {
    AVAILABLE: 'Available',
    READY: 'Ready',
    RESERVED: 'Reserved',
    OCCUPIED: 'Occupied',
    CLEANING: 'Cleaning',
    DIRTY: 'Dirty',
    MAINTENANCE: 'Maintenance',
    CHECKOUT_PENDING: 'Checkout pending',
    INACTIVE: 'Inactive',
  },
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
  const { hasPermission } = usePermission();

  const canCreate = hasPermission('ROOM_CREATE');
  const canUpdate = hasPermission('ROOM_UPDATE');
  const canDelete = hasPermission('ROOM_DELETE');

  // Override readOnly if user has write permissions
  const isReadOnly = readOnly || (!canCreate && !canUpdate && !canDelete);
  const [items, setItems] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchOpt, setSearchOpt] = useState('roomNumber');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchDataDirect = useCallback(async (p, opt, val) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      const trimmed = val ? String(val).trim() : '';
      if (trimmed) {
        if (opt === 'id') {
          params.id = trimmed;
        } else if (opt === 'roomNumber') {
          params.roomNumber = trimmed;
        } else if (opt === 'roomTypeId') {
          params.roomTypeId = trimmed;
        } else if (opt === 'floor') {
          params.floor = trimmed;
        } else if (opt === 'status') {
          params.status = trimmed;
        }
      }
      const res = await getAllRooms(params, locale);
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message || t('room.toast.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  const fetchData = useCallback(async (p = page) => {
    await fetchDataDirect(p, searchOpt, search);
  }, [page, searchOpt, search, fetchDataDirect]);

  useEffect(() => { fetchData(page); }, [page, fetchData]);

  useEffect(() => {
    getRoomTypes({ page: 0, size: 100 }, locale)
        .then(res => setRoomTypes(res?.data?.content ?? []))
        .catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    setForm({
      roomTypeId: getRoomTypeId(item),
      floorNumber: item.floorNumber || '',
      description: item.description || '',
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });


  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      roomTypeId: Number(form.roomTypeId),
      floorNumber: Number(form.floorNumber),
      description: form.description,
    };

    setSaving(true);
    try {
      if (modal.editing) {
        await updateRoom(modal.editing.id, payload, locale);
        notify(t('room.toast.updateSuccess'));
      } else {
        await createRoom(payload, locale);
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
    try {
      await deleteRoom(item.id, locale);
      notify(t('room.toast.deleteSuccess'));
      fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('room.toast.forbiddenDelete') : e.message, 'error');
    } finally {
      setDeleteConfirmId(null);
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
    const displayStatus = STATUS_LABELS[locale]?.[status] || status;
    return (
        <tr key={item.id} className="hover:bg-stone-50">
          <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
          <td className="px-4 py-3 font-bold">{item.roomNumber}</td>
          <td className="px-4 py-3 text-xs text-slate-500">
            {item.roomTypeName || item.roomType?.typeName || '-'}
          </td>
          <td className="px-4 py-3 text-center">{item.floorNumber}</td>
          <td className="px-4 py-3">
            {isReadOnly ? (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-600'}`}>
              {displayStatus}
            </span>
            ) : (
                <select
                    value={status}
                    onChange={e => handleStatusChange(item, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border border-stone-200 outline-none cursor-pointer ${STATUS_COLORS[status] || 'bg-stone-100'}`}
                >
                  {Array.from(new Set([status, 'AVAILABLE', 'INACTIVE'])).map(s => {
                    const label = STATUS_LABELS[locale]?.[s] || s;
                    return <option key={s} value={s}>{label}</option>;
                  })}
                </select>
            )}
          </td>
          {!isReadOnly && (
              <td className="px-4 py-3">
                {deleteConfirmId === item.id ? (
                  <div className="flex items-center gap-2 justify-center">
                    <button onClick={() => handleDelete(item)} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-600 transition-colors">
                      {locale === 'vi' ? 'Xác nhận' : 'Confirm'}
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)} className="border border-stone-300 bg-white px-2 py-1 rounded text-xs font-medium text-slate-600 hover:bg-stone-100 transition-colors">
                      {locale === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 justify-center">
                    <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title={locale === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => setDeleteConfirmId(item.id)} className="text-red-500 hover:text-red-700" title={locale === 'vi' ? 'Xóa' : 'Delete'}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </td>
          )}
        </tr>
    );
  });

  const cols = [t('room.columns.id'), t('room.columns.roomNumber'), t('room.columns.roomType'), t('room.columns.floor'), t('room.columns.status'), ...(!isReadOnly ? [t('room.columns.actions')] : [])];

  return (
      <div>
        <Toast type={toast.type} message={toast.message} onClose={closeToast} />

        <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <select
                value={searchOpt}
                onChange={e => {
                  setSearchOpt(e.target.value);
                  setSearch('');
                  fetchDataDirect(0, e.target.value, '');
                }}
                className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white font-medium text-slate-700"
            >
              <option value="roomNumber">{t('room.searchOptions.roomNumber') || 'Số phòng'}</option>
              <option value="id">{t('room.searchOptions.id') || 'Mã (ID)'}</option>
              <option value="roomTypeId">{t('room.searchOptions.roomTypeId') || 'Loại phòng'}</option>
              <option value="floor">{t('room.searchOptions.floor') || 'Tầng'}</option>
              <option value="status">{t('room.searchOptions.status') || 'Trạng thái'}</option>
            </select>

            {searchOpt === 'roomTypeId' ? (
                <select
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      fetchDataDirect(0, searchOpt, e.target.value);
                    }}
                    className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white font-medium text-slate-700 max-w-xs flex-1"
                >
                  <option value="">{t('room.modal.selectType') || 'Chọn loại phòng'}</option>
                  {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.typeName}</option>
                  ))}
                </select>
            ) : searchOpt === 'status' ? (
                <select
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      fetchDataDirect(0, searchOpt, e.target.value);
                    }}
                    className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white font-medium text-slate-700 max-w-xs flex-1"
                >
                  <option value="">{t('booking.filters.all') || 'Tất cả'}</option>
                  <option value="AVAILABLE">{t('room.status.available') || 'Sẵn sàng'}</option>
                  <option value="MAINTENANCE">{t('room.status.maintenance') || 'Đang sửa chữa'}</option>
                </select>
            ) : (
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                      type={searchOpt === 'id' || searchOpt === 'floor' ? 'number' : 'text'}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchData(0)}
                      placeholder={
                        searchOpt === 'id' ? (t('room.placeholders.id') || 'Nhập mã ID...') :
                            searchOpt === 'floor' ? (t('room.placeholders.floor') || 'Nhập số tầng...') :
                                (t('room.placeholders.roomNumber') || t('room.searchPlaceholder') || 'Nhập số phòng...')
                      }
                      className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:border-[#bfa15f] outline-none"
                  />
                </div>
            )}
            <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow">
                  <Plus size={16} /> {t('room.addBtn')}
                </button>
            )}
          </div>
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

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
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
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
    const displayStatus = status === 'AVAILABLE' ? t('room.status.available') : t('room.status.maintenance');
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
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[status] || 'bg-stone-100'}`}
                >
                  {['AVAILABLE', 'MAINTENANCE'].map(s => {
                    const label = s === 'AVAILABLE' ? t('room.status.available') : t('room.status.maintenance');
                    return <option key={s} value={s}>{label}</option>;
                  })}
                </select>
            )}
          </td>
          {!isReadOnly && (
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

        {false && (<Modal
            open={false}
            title={locale === 'vi' ? 'Bản đồ trạng thái phòng' : 'Room status map'}
            onClose={() => setMapOpen(false)}
            size="2xl"
        >
          {mapLoading ? (
              <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
                <RefreshCw size={22} className="animate-spin text-[#bfa15f]" />
                {locale === 'vi' ? 'Đang tải sơ đồ phòng...' : 'Loading room map...'}
              </div>
          ) : roomsByFloor.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <BedDouble size={42} className="mx-auto mb-3 text-stone-300" />
                {locale === 'vi' ? 'Chưa có dữ liệu phòng.' : 'No rooms found.'}
              </div>
          ) : (
              <div className="space-y-8">
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {locale === 'vi' ? 'Chú thích trạng thái' : 'Status legend'}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.entries(MAP_STATUS_STYLES).map(([status, styles]) => (
                        <span key={status} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${styles}`}>
                          <span className="h-2.5 w-2.5 rounded-sm bg-current opacity-70" />
                          {STATUS_LABELS[locale === 'vi' ? 'vi' : 'en'][status]}
                        </span>
                    ))}
                  </div>
                </div>

                {roomsByFloor.map(([floor, rooms]) => (
                    <section key={floor} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between bg-slate-800 px-5 py-3 text-white">
                        <h4 className="flex items-center gap-2 font-bold">
                          <Layers3 size={18} className="text-[#d4b46a]" />
                          {locale === 'vi' ? `Tầng ${floor}` : `Floor ${floor}`}
                        </h4>
                        <span className="text-xs text-slate-300">{rooms.length} {locale === 'vi' ? 'phòng' : 'rooms'}</span>
                      </div>
                      <div className="bg-slate-50 p-5">
                        <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                          <span className="h-px flex-1 bg-stone-300" />
                          {locale === 'vi' ? 'Hành lang' : 'Corridor'}
                          <span className="h-px flex-1 bg-stone-300" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                          {rooms.map((room) => {
                            const status = getRoomStatus(room);
                            const styles = MAP_STATUS_STYLES[status] || MAP_STATUS_STYLES.INACTIVE;
                            return (
                                <div
                                    key={room.id}
                                    className={`group relative min-h-24 rounded-xl border-2 p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${styles}`}
                                    title={`${room.roomNumber} · ${STATUS_LABELS[locale === 'vi' ? 'vi' : 'en'][status] || status}`}
                                >
                                  <BedDouble size={22} className="mx-auto mb-1.5 opacity-80" />
                                  <p className="text-base font-black">{room.roomNumber}</p>
                                  <p className="mt-0.5 truncate text-[10px] font-semibold opacity-75">
                                    {room.roomTypeName || room.roomType?.typeName || '-'}
                                  </p>
                                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-current shadow-sm" />
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                ))}
              </div>
          )}
        </Modal>)}

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

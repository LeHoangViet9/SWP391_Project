import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { equipmentService } from '../services/equipmentService';
import { getAllRooms } from '../services/roomService';
import { useLocale } from '../context/LocaleContext';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const EMPTY_FORM = {
  equipmentName: '',
  equipmentCode: '',
  location: '',
  description: '',
  roomId: '',
};

const STATUS_LABELS = {
  ACTIVE: { label: 'Hoạt động', className: 'bg-emerald-100 text-emerald-700' },
  MAINTENANCE: { label: 'Bảo trì', className: 'bg-amber-100 text-amber-700' },
  BROKEN: { label: 'Hỏng', className: 'bg-red-100 text-red-700' },
  INACTIVE: { label: 'Ngừng dùng', className: 'bg-stone-100 text-stone-600' },
};

function getErrorMessage(error, fallback) {
  if (error?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  return error?.message || fallback;
}

function mapEquipmentToForm(item) {
  return {
    equipmentName: item.equipmentName || '',
    equipmentCode: item.equipmentCode || '',
    location: item.location || '',
    description: item.description || '',
    roomId: item.roomId ? String(item.roomId) : '',
  };
}

export default function EquipmentManager() {
  const { locale, t } = useLocale();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'MANAGER', 'MAINTENANCE');

  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast((current) => ({ ...current, message: '' }));

  const fetchData = useCallback(async (nextPage = page) => {
    setLoading(true);
    try {
      const response = await equipmentService.getAll({
        page: nextPage,
        size: 10,
        keywords: search.trim() || undefined,
      });
      const data = response?.data;
      setItems(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch (error) {
      notify(getErrorMessage(error, t('equipment.toast.loadError')), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  useEffect(() => {
    getAllRooms({ page: 0, size: 200 })
      .then((response) => setRooms(response?.data?.content ?? []))
      .catch(() => setRooms([]));
  }, []);

  const roomOptions = useMemo(
    () => rooms.map((room) => ({
      id: room.id,
      label: `${room.roomNumber}${room.roomTypeName ? ` - ${room.roomTypeName}` : ''}`,
    })),
    [rooms]
  );

  const openCreate = () => {
    if (!canManage) {
      notify(t('equipment.toast.forbiddenCreate'), 'error');
      return;
    }
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    if (!canManage) {
      notify(t('equipment.toast.forbiddenEdit'), 'error');
      return;
    }
    setForm(mapEquipmentToForm(item));
    setModal({ open: true, editing: item });
  };

  const closeModal = () => {
    setModal({ open: false, editing: null });
    setForm(EMPTY_FORM);
  };

  const buildPayload = () => ({
    equipmentName: form.equipmentName.trim(),
    equipmentCode: form.equipmentCode.trim(),
    location: form.location.trim(),
    description: form.description.trim() || null,
    roomId: form.roomId ? Number(form.roomId) : null,
  });

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildPayload();
      if (modal.editing) {
        await equipmentService.update(modal.editing.id, payload);
        notify(t('equipment.toast.updateSuccess'));
      } else {
        await equipmentService.create(payload);
        notify(t('equipment.toast.addSuccess'));
      }
      closeModal();
      fetchData(page);
    } catch (error) {
      notify(getErrorMessage(error, t('equipment.toast.loadError')), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canManage) {
      notify(t('equipment.toast.forbiddenDelete'), 'error');
      return;
    }
    if (!window.confirm(t('equipment.toast.deleteConfirm', { name: item.equipmentName }).replace('{name}', item.equipmentName))) return;

    try {
      await equipmentService.delete(item.id);
      notify(t('equipment.toast.deleteSuccess'));
      fetchData(page);
    } catch (error) {
      notify(getErrorMessage(error, t('equipment.toast.loadError')), 'error');
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchData(0);
  };

  const statusBadge = (status = 'ACTIVE') => {
    const statusInfo = STATUS_LABELS[status] || { label: status, className: 'bg-stone-100 text-stone-600' };
    return (
      <span className={`inline-flex min-w-[72px] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusInfo.className}`}>
        {t(`equipment.status.${status}`)}
      </span>
    );
  };

  const rows = items.map((item) => (
    <tr key={item.id} className="hover:bg-stone-50">
      <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
      <td className="px-4 py-3 font-semibold">{item.equipmentName}</td>
      <td className="px-4 py-3 font-mono text-xs text-[#bfa15f]">{item.equipmentCode}</td>
      <td className="px-4 py-3 text-sm">{item.location}</td>
      <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-500">{item.description || '-'}</td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {item.roomNumber || (item.roomId ? `${locale === 'vi' ? 'Phòng' : 'Room'} #${item.roomId}` : t('equipment.noRoom'))}
      </td>
      <td className="px-4 py-3">{statusBadge(item.status)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="text-blue-500 hover:text-blue-700"
                title="Sửa thiết bị"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item)}
                className="text-red-500 hover:text-red-700"
                title="Xóa thiết bị"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  ));

  const columns = [t('equipment.columns.id'), t('equipment.columns.name'), t('equipment.columns.code'), t('equipment.columns.location'), t('equipment.columns.description'), t('equipment.columns.room'), t('equipment.columns.status'), t('equipment.columns.actions')];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              placeholder={t('equipment.searchPlaceholder')}
              className="w-full rounded border border-stone-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="rounded border p-2 hover:bg-stone-100"
            title="Tải lại"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded bg-[#bfa15f] px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-[#a3854a]"
          >
            <Plus size={16} />
            {t('equipment.addBtn')}
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Modal
        open={modal.open}
        title={modal.editing ? t('equipment.modal.editTitle') : t('equipment.modal.addTitle')}
        onClose={closeModal}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              {t('equipment.modal.name')}
            </label>
            <input
              required
              value={form.equipmentName}
              onChange={(event) => setForm((current) => ({ ...current, equipmentName: event.target.value }))}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
              placeholder={t('equipment.modal.namePlaceholder')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                {t('equipment.modal.code')}
              </label>
              <input
                required
                pattern="^[A-Za-z0-9\-]{2,30}$"
                value={form.equipmentCode}
                onChange={(event) => setForm((current) => ({ ...current, equipmentCode: event.target.value }))}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                placeholder={t('equipment.modal.codePlaceholder')}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                {t('equipment.modal.location')}
              </label>
              <input
                required
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                placeholder={t('equipment.modal.locationPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              {t('equipment.modal.room')}
            </label>
            <select
              value={form.roomId}
              onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))}
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
            >
              <option value="">{t('equipment.noRoomOption')}</option>
              {roomOptions.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              {t('equipment.modal.description')}
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="w-full resize-none rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-60"
            >
              {t('equipment.modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[#bfa15f] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#a3854a] disabled:opacity-60"
            >
              {saving ? t('equipment.modal.saving') : modal.editing ? t('equipment.modal.update') : t('equipment.modal.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { equipmentService } from '../services/equipmentService';
import { getAllRooms } from '../services/roomService';
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
      notify(getErrorMessage(error, 'Không tải được danh sách thiết bị.'), 'error');
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
      notify('Bạn không có quyền thêm thiết bị.', 'error');
      return;
    }
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    if (!canManage) {
      notify('Bạn không có quyền sửa thiết bị.', 'error');
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
        notify('Cập nhật thiết bị thành công.');
      } else {
        await equipmentService.create(payload);
        notify('Thêm thiết bị thành công.');
      }
      closeModal();
      fetchData(page);
    } catch (error) {
      notify(getErrorMessage(error, 'Không lưu được thiết bị.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canManage) {
      notify('Bạn không có quyền xóa thiết bị.', 'error');
      return;
    }
    if (!window.confirm(`Xóa thiết bị "${item.equipmentName}"?`)) return;

    try {
      await equipmentService.delete(item.id);
      notify('Đã xóa thiết bị.');
      fetchData(page);
    } catch (error) {
      notify(getErrorMessage(error, 'Không xóa được thiết bị.'), 'error');
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
        {statusInfo.label}
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
        {item.roomNumber || (item.roomId ? `Phòng #${item.roomId}` : 'Chưa gán')}
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

  const columns = ['ID', 'Tên thiết bị', 'Mã thiết bị', 'Vị trí', 'Mô tả', 'Phòng', 'Trạng thái', 'Thao tác'];

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
              placeholder="Tìm thiết bị..."
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
            Thêm thiết bị
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
        title={modal.editing ? 'Cập nhật thiết bị' : 'Thêm thiết bị'}
        onClose={closeModal}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Tên thiết bị *
            </label>
            <input
              required
              value={form.equipmentName}
              onChange={(event) => setForm((current) => ({ ...current, equipmentName: event.target.value }))}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
              placeholder="Điều hòa, TV, tủ lạnh..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mã thiết bị *
              </label>
              <input
                required
                pattern="^[A-Za-z0-9\-]{2,30}$"
                value={form.equipmentCode}
                onChange={(event) => setForm((current) => ({ ...current, equipmentCode: event.target.value }))}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                placeholder="TV-101"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Vị trí *
              </label>
              <input
                required
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                placeholder="Phòng 101, kho tầng 2..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Gán phòng
            </label>
            <select
              value={form.roomId}
              onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))}
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
            >
              <option value="">Chưa gán phòng</option>
              {roomOptions.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Mô tả
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
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[#bfa15f] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#a3854a] disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

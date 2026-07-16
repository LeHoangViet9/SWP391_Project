import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, ImagePlus, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { usePermission } from '../hooks/usePermission';
import { equipmentService } from '../services/equipmentService';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const EMPTY_FORM = {
  equipmentName: '',
  equipmentCode: '',
  description: '',
};

const STATUS_LABELS = {
  ACTIVE: { label: 'Hoạt động', className: 'bg-emerald-100 text-emerald-700' },
  MAINTENANCE: { label: 'Bảo trì', className: 'bg-amber-100 text-amber-700' },
  BROKEN: { label: 'Hỏng', className: 'bg-red-100 text-red-700' },
  INACTIVE: { label: 'Ngừng dùng', className: 'bg-stone-100 text-stone-600' },
};

function getErrorMessage(error, fallback) {
  if (error?.status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }

  return (
      error?.data?.message ||
      error?.message ||
      fallback ||
      'Có lỗi xảy ra.'
  );
}

function mapEquipmentToForm(item) {
  return {
    equipmentName: item.equipmentName || '',
    equipmentCode: item.equipmentCode || '',
    description: item.description || '',
  };
}

function getImageUrl(item) {
  const imageUrl =
      item?.images?.find((img) => img.isPrimary)?.imageUrl ||
      item?.images?.[0]?.imageUrl;

  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;

  // THAY ĐỔI: Thay vì hardcode cổng 9999 sai, trả về relative path để chạy qua Vite proxy
  return imageUrl;
}

export default function EquipmentManager() {
  const { locale, t } = useLocale();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission('EQUIPMENT_CREATE');
  const canUpdate = hasPermission('EQUIPMENT_UPDATE');
  const canDelete = hasPermission('EQUIPMENT_DELETE');
  const canManage = canCreate || canUpdate || canDelete;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [searchOpt, setSearchOpt] = useState('equipmentName');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const [toast, setToast] = useState({ type: 'success', message: '' });

  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmId, setConfirmId] = useState(null);

  // SỬA: dùng mảng ảnh thay vì 1 file
  const [imageFiles, setImageFiles] = useState([]);

  const [saving, setSaving] = useState(false);
  const [existingCodes, setExistingCodes] = useState([]);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast((current) => ({ ...current, message: '' }));

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await equipmentService.getAll({ page: 0, size: 1000 }, locale);
      const allItems = response?.data?.content ?? [];

      const codes = [...new Set(allItems.map((item) => item.equipmentCode).filter(Boolean))];

      setExistingCodes(codes);
    } catch (error) {
      console.error('Failed to fetch equipment suggestions:', error);
    }
  }, [locale]);

  const fetchDataDirect = useCallback(
      async (p, opt, val, statusVal) => {
        setLoading(true);

        try {
          const params = {
            page: p,
            size: 10,
            status: statusVal || undefined,
          };

          const trimmed = val ? String(val).trim() : '';

          if (trimmed) {
            if (opt === 'id') {
              params.id = trimmed;
            } else if (opt === 'equipmentName') {
              params.equipmentName = trimmed;
            } else if (opt === 'equipmentCode') {
              params.equipmentCode = trimmed;
            }
          }

          const response = await equipmentService.getAll(params, locale);
          const data = response?.data;

          setItems(data?.content ?? []);
          setTotalPages(data?.totalPages ?? 1);
        } catch (error) {
          notify(getErrorMessage(error, t('equipment.toast.loadError')), 'error');
        } finally {
          setLoading(false);
        }
      },
      [locale, t]
  );

  const fetchData = useCallback(
      async (nextPage = page) => {
        await fetchDataDirect(nextPage, searchOpt, search, statusFilter);
      },
      [page, searchOpt, search, statusFilter, fetchDataDirect]
  );

  useEffect(() => {
    fetchData(page);
  }, [page, statusFilter, fetchData]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const openCreate = () => {
    if (!canManage) {
      notify(t('equipment.toast.forbiddenCreate'), 'error');
      return;
    }

    setForm(EMPTY_FORM);
    // THAY ĐỔI: Reset state tệp ảnh cũ khi mở form tạo mới
    setImageFiles([]);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    if (!canManage) {
      notify(t('equipment.toast.forbiddenEdit'), 'error');
      return;
    }
    setForm(mapEquipmentToForm(item));
    // THAY ĐỔI: Reset state tệp ảnh cũ khi mở form chỉnh sửa
    setImageFiles([]);
    setModal({ open: true, editing: item });
  };

  const closeModal = () => {
    setModal({ open: false, editing: null });
    setForm(EMPTY_FORM);
    // THAY ĐỔI: Reset state tệp ảnh khi đóng modal để tránh gửi đè lên các thao tác sau
    setImageFiles([]);
  };

  const buildPayload = () => ({
    equipmentName: form.equipmentName.trim(),
    equipmentCode: form.equipmentCode.trim(),
    description: form.description.trim() || null,
  });

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildPayload();

      if (modal.editing) {
        await equipmentService.update(modal.editing.id, payload, locale);

        if (imageFiles.length > 0) {
          await equipmentService.uploadImages(
              modal.editing.id,
              imageFiles,
              locale
          );
        }

        notify(t('equipment.toast.updateSuccess') || 'Cập nhật thiết bị thành công');
      } else {
        const created = await equipmentService.create(payload, locale);
        const equipmentId = created?.data?.id;

        if (imageFiles.length > 0 && equipmentId) {
          await equipmentService.uploadImages(
              equipmentId,
              imageFiles,
              locale
          );
        }

        notify(t('equipment.toast.addSuccess') || 'Thêm thiết bị thành công');
      }

      closeModal();
      fetchData(page);
      fetchSuggestions();
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

    try {
      await equipmentService.delete(item.id, locale);
      notify(t('equipment.toast.deleteSuccess') || 'Xóa thiết bị thành công');
      setConfirmId(null);
      fetchData(page);
      fetchSuggestions();
    } catch (error) {
      console.error(error);
      notify(
          getErrorMessage(
              error,
              'Không thể xóa thiết bị.'
          ),
          'error'
      );
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchDataDirect(0, searchOpt, search, statusFilter);
  };

  const statusBadge = (status = 'ACTIVE') => {
    const statusInfo = STATUS_LABELS[status] || {
      label: status,
      className: 'bg-stone-100 text-stone-600',
    };

    return (
        <span
            className={`inline-flex min-w-[72px] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusInfo.className}`}
        >
        {t(`equipment.status.${status}`) || statusInfo.label}
      </span>
    );
  };

  const rows = items.map((item) => {
    const imageUrl = getImageUrl(item);
    const assignedRoomCount = item.assignedRooms?.length || 0;

    return (
        <tr key={item.id} className="hover:bg-stone-50">
          <td className="px-4 py-3 font-mono text-xs">{item.id}</td>

          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-stone-200 bg-stone-50">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={item.equipmentName}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <ImagePlus size={18} className="text-stone-400" />
                )}
              </div>

              <div>
                <div className="font-semibold">{item.equipmentName}</div>
                <div className="text-xs text-slate-400">
                  {item.images?.length || 0} ảnh
                </div>
              </div>
            </div>
          </td>

          <td className="px-4 py-3 font-mono text-xs text-[#bfa15f]">
            {item.equipmentCode}
          </td>

          <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-500">
            {item.description || '-'}
          </td>

          <td className="px-4 py-3 text-sm text-slate-500">
            {assignedRoomCount > 0 ? `${assignedRoomCount} phòng` : 'Chưa gán phòng'}
          </td>

          <td className="px-4 py-3">
            {statusBadge(item.status)}
          </td>

          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              {canManage && (
                confirmId === item.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                      title="Xác nhận xóa"
                    >
                      Xác nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="text-[10px] px-2 py-0.5 border border-stone-300 rounded hover:bg-stone-100 text-slate-600"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
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
                      onClick={() => setConfirmId(item.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Xóa thiết bị"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )
              )}
            </div>
          </td>
        </tr>
    );
  });

  const columns = [
    t('equipment.columns.id') || 'ID',
    t('equipment.columns.name') || 'Tên thiết bị',
    t('equipment.columns.code') || 'Mã thiết bị',
    t('equipment.columns.description') || 'Mô tả',
    'Phòng đã gán',
    t('equipment.columns.status') || 'Trạng thái',
    t('equipment.columns.actions') || 'Thao tác',
  ];

  return (
      <div>
        <Toast type={toast.type} message={toast.message} onClose={closeToast} />

        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <select
                value={searchOpt}
                onChange={(e) => {
                  setSearchOpt(e.target.value);
                  setSearch('');
                }}
                className="rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
            >
              <option value="equipmentName">
                {t('equipment.searchOptions.name') || 'Tên thiết bị'}
              </option>
              <option value="equipmentCode">
                {t('equipment.searchOptions.code') || 'Mã thiết bị'}
              </option>
              <option value="id">
                {t('equipment.searchOptions.id') || 'Mã ID'}
              </option>
            </select>

            <div className="relative max-w-xs flex-1">
              <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                  type={searchOpt === 'id' ? 'number' : 'text'}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                  placeholder={
                      t(`equipment.placeholders.${searchOpt}`) ||
                      t('equipment.searchPlaceholder') ||
                      'Tìm kiếm'
                  }
                  className="w-full rounded border border-stone-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#bfa15f]"
              />
            </div>

            <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
            >
              <option value="ACTIVE">{t('equipment.status.ACTIVE') || 'Hoạt động'}</option>
              <option value="MAINTENANCE">{t('equipment.status.MAINTENANCE') || 'Bảo trì'}</option>
              <option value="BROKEN">{t('equipment.status.BROKEN') || 'Hỏng'}</option>
              <option value="INACTIVE">{t('equipment.status.INACTIVE') || 'Ngừng dùng'}</option>
              <option value="">{t('equipment.status.all') || 'Tất cả trạng thái'}</option>
            </select>

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
                {t('equipment.addBtn') || 'Thêm thiết bị'}
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
            title={
              modal.editing
                  ? t('equipment.modal.editTitle') || 'Sửa thiết bị'
                  : t('equipment.modal.addTitle') || 'Thêm thiết bị'
            }
            onClose={closeModal}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                {t('equipment.modal.name') || 'Tên thiết bị'}
              </label>
              <input
                  required
                  value={form.equipmentName}
                  onChange={(event) =>
                      setForm((current) => ({ ...current, equipmentName: event.target.value }))
                  }
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                  placeholder={t('equipment.modal.namePlaceholder') || 'Ví dụ: TV Samsung'}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                {t('equipment.modal.code') || 'Mã thiết bị'}
              </label>
              <input
                  required
                  pattern="^[A-Za-z0-9\\-]{2,30}$"
                  value={form.equipmentCode}
                  onChange={(event) =>
                      setForm((current) => ({ ...current, equipmentCode: event.target.value }))
                  }
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                  placeholder={t('equipment.modal.codePlaceholder') || 'Ví dụ: TV'}
                  list="existing-codes"
              />
              <datalist id="existing-codes">
                {existingCodes.map((code) => (
                    <option key={code} value={code} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Ảnh thiết bị
              </label>

              <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.webp|\.gif)$/i;
                    const invalidFiles = files.filter(file => !allowedExtensions.test(file.name));
                    if (invalidFiles.length > 0) {
                      notify('Định dạng file không hợp lệ. Chỉ chấp nhận: .jpg, .jpeg, .png, .webp, .gif', 'error');
                      event.target.value = ''; // Reset input
                      setImageFiles([]);
                      return;
                    }
                    setImageFiles(files);
                  }}
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
              />

              {imageFiles.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Đã chọn {imageFiles.length} ảnh
                  </p>
              )}

              <p className="mt-1 text-xs text-slate-400">
                {modal.editing
                    ? 'Nếu chọn ảnh mới, hệ thống sẽ upload thêm các ảnh cho thiết bị này.'
                    : 'Các ảnh sẽ được upload sau khi tạo thiết bị thành công.'}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                {t('equipment.modal.description') || 'Mô tả'}
              </label>
              <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                  }
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
                {t('equipment.modal.cancel') || 'Hủy'}
              </button>

              <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-[#bfa15f] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#a3854a] disabled:opacity-60"
              >
                {saving
                    ? t('equipment.modal.saving') || 'Đang lưu...'
                    : modal.editing
                        ? t('equipment.modal.update') || 'Cập nhật'
                        : t('equipment.modal.save') || 'Lưu'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
  );
}
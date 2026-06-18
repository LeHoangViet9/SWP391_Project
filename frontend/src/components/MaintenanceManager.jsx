import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Check, ChevronDown, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { maintenanceService } from '../services/maintenanceService';
import { useLocale } from '../context/LocaleContext';
import { getAllRooms } from '../services/roomService';
import { equipmentService } from '../services/equipmentService';
import { getUsers } from '../services/userService';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const SEVERITY_COLORS = {
  LOW: 'bg-stone-100 text-stone-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const EMPTY_CREATE = {
  roomId: '',
  equipmentId: '',
  reportedBy: '',
  issueTitle: '',
  issueDescription: '',
  severity: 'MEDIUM',
};

const EMPTY_UPDATE = {
  assignedTo: '',
  severity: 'MEDIUM',
  status: 'PENDING',
  diagnosis: '',
  repairResult: '',
};

export default function MaintenanceManager({ readOnly = false }) {
  const { t } = useLocale();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [searchOpt, setSearchOpt] = useState('issueTitle');
  const [statusFilter, setStatusFilter] = useState('');

  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);

  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false);

  const [reportedBySearchQuery, setReportedBySearchQuery] = useState('');
  const [isReportedByDropdownOpen, setIsReportedByDropdownOpen] = useState(false);

  const [assignedToSearchQuery, setAssignedToSearchQuery] = useState('');
  const [isAssignedToDropdownOpen, setIsAssignedToDropdownOpen] = useState(false);

  useEffect(() => {
    getAllRooms({ page: 0, size: 200 })
        .then((response) => setRooms(response?.data?.content ?? []))
        .catch(() => setRooms([]));

    equipmentService.getAll({ page: 0, size: 1000 })
        .then((response) => setEquipments(response?.data?.content ?? []))
        .catch(() => setEquipments([]));

    getUsers({ page: 0, size: 1000 })
        .then((response) => setUsersList(response?.data?.content ?? []))
        .catch(() => setUsersList([]));
  }, []);

  // Hiển thị label phòng đã chọn lên ô input
  useEffect(() => {
    if (form.roomId) {
      const selectedRoom = rooms.find((r) => String(r.id) === String(form.roomId));
      if (selectedRoom) {
        setRoomSearchQuery(
            `${selectedRoom.roomNumber}${selectedRoom.roomTypeName ? ` - ${selectedRoom.roomTypeName}` : ''}`
        );
      } else {
        setRoomSearchQuery(String(form.roomId));
      }
    } else {
      setRoomSearchQuery('');
    }
  }, [form.roomId, rooms]);

  // Hiển thị label thiết bị đã chọn lên ô input
  useEffect(() => {
    if (form.equipmentId) {
      const selectedEquip = equipments.find((e) => String(e.id) === String(form.equipmentId));
      if (selectedEquip) {
        setEquipmentSearchQuery(
            `${selectedEquip.equipmentName}${selectedEquip.equipmentCode ? ` (${selectedEquip.equipmentCode})` : ''}`
        );
      } else {
        setEquipmentSearchQuery(String(form.equipmentId));
      }
    } else {
      setEquipmentSearchQuery('');
    }
  }, [form.equipmentId, equipments]);

  // Hiển thị nhân viên báo cáo đã chọn
  useEffect(() => {
    if (form.reportedBy) {
      const selectedReporter = usersList.find((u) => String(u.id) === String(form.reportedBy));
      if (selectedReporter) {
        setReportedBySearchQuery(
            `${selectedReporter.fullName} (${selectedReporter.userName || selectedReporter.username || ''})`
        );
      } else {
        setReportedBySearchQuery(String(form.reportedBy));
      }
    } else {
      setReportedBySearchQuery('');
    }
  }, [form.reportedBy, usersList]);

  // Hiển thị nhân viên được giao đã chọn
  useEffect(() => {
    if (form.assignedTo) {
      const selectedAssignee = usersList.find((u) => String(u.id) === String(form.assignedTo));
      if (selectedAssignee) {
        setAssignedToSearchQuery(
            `${selectedAssignee.fullName} (${selectedAssignee.userName || selectedAssignee.username || ''})`
        );
      } else {
        setAssignedToSearchQuery(String(form.assignedTo));
      }
    } else {
      setAssignedToSearchQuery('');
    }
  }, [form.assignedTo, usersList]);

  const filteredReporters = useMemo(() => {
    const query = reportedBySearchQuery.trim().toLowerCase();
    if (!query) return usersList;

    const selectedReporter = usersList.find((u) => String(u.id) === String(form.reportedBy));
    const selectedLabel = selectedReporter
        ? `${selectedReporter.fullName} (${selectedReporter.userName || selectedReporter.username || ''})`.toLowerCase()
        : '';

    if (query === selectedLabel) return usersList;

    return usersList.filter((u) => {
      const name = (u.fullName || '').toLowerCase();
      const uname = (u.userName || u.username || '').toLowerCase();
      return name.includes(query) || uname.includes(query);
    });
  }, [usersList, reportedBySearchQuery, form.reportedBy]);

  const filteredAssignees = useMemo(() => {
    const query = assignedToSearchQuery.trim().toLowerCase();
    if (!query) return usersList;

    const selectedAssignee = usersList.find((u) => String(u.id) === String(form.assignedTo));
    const selectedLabel = selectedAssignee
        ? `${selectedAssignee.fullName} (${selectedAssignee.userName || selectedAssignee.username || ''})`.toLowerCase()
        : '';

    if (query === selectedLabel) return usersList;

    return usersList.filter((u) => {
      const name = (u.fullName || '').toLowerCase();
      const uname = (u.userName || u.username || '').toLowerCase();
      return name.includes(query) || uname.includes(query);
    });
  }, [usersList, assignedToSearchQuery, form.assignedTo]);

  const filteredRooms = useMemo(() => {
    // SỬA:
    // Bỏ logic lọc phòng theo selectedEquip.roomId.
    // Vì kiến trúc mới Equipment không còn roomId.
    // Quan hệ phòng - thiết bị nằm trong bảng RoomEquipment.
    let list = rooms;

    const query = roomSearchQuery.trim().toLowerCase();
    if (!query) return list;

    const selectedRoom = list.find((r) => String(r.id) === String(form.roomId));
    const selectedLabel = selectedRoom
        ? `${selectedRoom.roomNumber}${selectedRoom.roomTypeName ? ` - ${selectedRoom.roomTypeName}` : ''}`.toLowerCase()
        : '';

    if (query === selectedLabel) return list;

    return list.filter((room) => {
      const roomNum = String(room.roomNumber).toLowerCase();
      const typeName = (room.roomTypeName || '').toLowerCase();
      return roomNum.includes(query) || typeName.includes(query);
    });
  }, [rooms, roomSearchQuery, form.roomId]);

  const filteredEquipments = useMemo(() => {
    // SỬA:
    // Bỏ logic list.filter(e => e.roomId === form.roomId).
    // Equipment hiện tại chỉ là danh mục thiết bị.
    // Frontend không tự kiểm tra thiết bị thuộc phòng nào nữa.
    // Backend sẽ validate qua RoomEquipment.
    let list = equipments;

    const query = equipmentSearchQuery.trim().toLowerCase();
    if (!query) return list;

    const selectedEquip = list.find((e) => String(e.id) === String(form.equipmentId));
    const selectedLabel = selectedEquip
        ? `${selectedEquip.equipmentName}${selectedEquip.equipmentCode ? ` (${selectedEquip.equipmentCode})` : ''}`.toLowerCase()
        : '';

    if (query === selectedLabel) return list;

    return list.filter((equip) => {
      const name = (equip.equipmentName || '').toLowerCase();
      const code = (equip.equipmentCode || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [equipments, equipmentSearchQuery, form.equipmentId]);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast((current) => ({ ...current, message: '' }));

  const fetchDataDirect = useCallback(async (p, opt, val, statusVal) => {
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
        } else if (opt === 'issueTitle') {
          params.issueTitle = trimmed;
        } else if (opt === 'roomId') {
          params.roomId = trimmed;
        } else if (opt === 'equipmentId') {
          params.equipmentId = trimmed;
        } else if (opt === 'reportedBy') {
          params.reportedBy = trimmed;
        } else if (opt === 'assignedTo') {
          params.assignedTo = trimmed;
        }
      }

      const res = await maintenanceService.getAll(params);
      const data = res?.data;

      setItems(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(
      async (p = page) => {
        await fetchDataDirect(p, searchOpt, search, statusFilter);
      },
      [page, searchOpt, search, statusFilter, fetchDataDirect]
  );

  useEffect(() => {
    fetchData(page);
  }, [page, statusFilter, fetchData]);

  const handleSearch = () => {
    setPage(0);
    fetchDataDirect(0, searchOpt, search, statusFilter);
  };

  const openCreate = () => {
    setForm({
      ...EMPTY_CREATE,
      reportedBy: user?.id ? String(user.id) : '',
    });
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    setForm({
      assignedTo: item.assignedTo || '',
      severity: item.severity || 'MEDIUM',
      status: item.status || 'PENDING',
      diagnosis: item.diagnosis || '',
      repairResult: item.repairResult || '',
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => {
    setModal({ open: false, editing: null });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (modal.editing) {
        const payload = {
          assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
          severity: form.severity,
          status: form.status,
          diagnosis: form.diagnosis || undefined,
          repairResult: form.repairResult || undefined,
        };

        await maintenanceService.update(modal.editing.id, payload);
        notify(t('maintenance.toast.updateSuccess'));
      } else {
        if (!form.reportedBy) {
          notify('Vui lòng chọn nhân viên báo cáo từ danh sách.', 'error');
          setSaving(false);
          return;
        }

        // SỬA:
        // Backend yêu cầu maintenance request phải gắn với phòng hoặc thiết bị.
        // Cho phép chọn:
        // 1. Chỉ phòng
        // 2. Chỉ thiết bị
        // 3. Cả phòng và thiết bị
        if (!form.roomId && !form.equipmentId) {
          notify('Phải chọn phòng hoặc thiết bị.', 'error');
          setSaving(false);
          return;
        }

        const payload = {
          roomId: form.roomId ? Number(form.roomId) : undefined,
          equipmentId: form.equipmentId ? Number(form.equipmentId) : undefined,
          reportedBy: Number(form.reportedBy),
          issueTitle: form.issueTitle.trim(),
          issueDescription: form.issueDescription.trim(),
          severity: form.severity,
        };

        await maintenanceService.create(payload);
        notify(t('maintenance.toast.addSuccess'));
      }

      closeModal();
      fetchData();
    } catch (e) {
      notify(
          e.status === 403
              ? t('maintenance.toast.forbidden')
              : e.message || t('maintenance.toast.loadError'),
          'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t('maintenance.toast.deleteConfirm', { id: item.id }).replace('{id}', item.id))) return;

    try {
      await maintenanceService.delete(item.id);
      notify(t('maintenance.toast.deleteSuccess'));
      fetchData();
    } catch (e) {
      notify(e.status === 403 ? t('maintenance.toast.forbiddenDelete') : e.message, 'error');
    }
  };

  const formatDate = (dt) => (dt ? new Date(dt).toLocaleDateString('vi-VN') : '-');

  const rows = items.map((item) => {
    const room = rooms.find((r) => String(r.id) === String(item.roomId));
    const equip = equipments.find((e) => String(e.id) === String(item.equipmentId));
    const reporter = usersList.find((u) => String(u.id) === String(item.reportedBy));
    const assignee = usersList.find((u) => String(u.id) === String(item.assignedTo));

    return (
        <tr key={item.id} className="hover:bg-stone-50">
          <td className="px-4 py-3 font-mono text-xs font-bold">#{item.id}</td>

          <td className="px-4 py-3 font-semibold text-sm">
            {item.issueTitle}
          </td>

          <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
            {item.issueDescription || '-'}
          </td>

          <td className="px-4 py-3 text-xs">
            {room ? `Phòng ${room.roomNumber}` : item.roomId ? `Phòng #${item.roomId}` : '-'}
          </td>

          <td className="px-4 py-3 text-xs">
            {equip
                ? `${equip.equipmentName} (${equip.equipmentCode})`
                : item.equipmentId
                    ? `TB #${item.equipmentId}`
                    : '-'}
          </td>

          <td className="px-4 py-3 text-xs">
            {reporter
                ? `${reporter.fullName} (${reporter.userName || reporter.username || ''})`
                : item.reportedBy || '-'}
          </td>

          <td className="px-4 py-3 text-xs">
            {assignee
                ? `${assignee.fullName} (${assignee.userName || assignee.username || ''})`
                : item.assignedTo || '-'}
          </td>

          <td className="px-4 py-3">
          <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.MEDIUM
              }`}
          >
            {t(`maintenance.severity.${item.severity || 'MEDIUM'}`)}
          </span>
          </td>

          <td className="px-4 py-3">
          <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  STATUS_COLORS[item.status] || STATUS_COLORS.PENDING
              }`}
          >
            {t(`maintenance.status.${item.status || 'PENDING'}`)}
          </span>
          </td>

          <td className="px-4 py-3 text-xs text-slate-400">
            {formatDate(item.createdAt)}
          </td>

          {!readOnly && (
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
          )}
        </tr>
    );
  });

  const cols = [
    t('maintenance.columns.id'),
    t('maintenance.columns.title'),
    t('maintenance.columns.description'),
    t('maintenance.columns.room'),
    t('maintenance.columns.equipment'),
    t('maintenance.columns.reportedBy'),
    t('maintenance.columns.assignedTo'),
    t('maintenance.columns.severity'),
    t('maintenance.columns.status'),
    t('maintenance.columns.createdAt'),
    ...(!readOnly ? [t('maintenance.columns.actions')] : []),
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
              <option value="issueTitle">{t('maintenance.searchOptions.title') || 'Tiêu đề lỗi'}</option>
              <option value="roomId">{t('maintenance.searchOptions.roomId') || 'Mã phòng'}</option>
              <option value="equipmentId">{t('maintenance.searchOptions.equipmentId') || 'Mã thiết bị'}</option>
              <option value="reportedBy">{t('maintenance.searchOptions.reportedBy') || 'Mã người báo'}</option>
              <option value="assignedTo">{t('maintenance.searchOptions.assignedTo') || 'Mã người sửa'}</option>
              <option value="id">{t('maintenance.searchOptions.id') || 'Mã yêu cầu'}</option>
            </select>

            <div className="relative max-w-xs flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                  type={searchOpt === 'issueTitle' ? 'text' : 'number'}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                  placeholder={
                      t(`maintenance.placeholders.${searchOpt}`) ||
                      t('maintenance.searchPlaceholder') ||
                      'Tìm kiếm...'
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
              <option value="">{t('maintenance.status.all') || 'Tất cả trạng thái'}</option>
              {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {t(`maintenance.status.${opt}`) || opt}
                  </option>
              ))}
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

          {!readOnly && (
              <button
                  type="button"
                  onClick={openCreate}
                  className="flex items-center gap-2 rounded bg-[#bfa15f] px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-[#a3854a]"
              >
                <Plus size={16} />
                {t('maintenance.addBtn')}
              </button>
          )}
        </div>

        <DataTable
            columns={cols}
            rows={rows}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            emptyText={t('maintenance.emptyText')}
        />

        <Modal
            open={modal.open}
            title={modal.editing ? t('maintenance.modal.editTitle') : t('maintenance.modal.addTitle')}
            onClose={closeModal}
            size="lg"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {modal.editing ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        {t('maintenance.modal.assignedTo')}
                      </label>

                      <div className="relative">
                        <input
                            type="text"
                            value={assignedToSearchQuery}
                            onFocus={() => setIsAssignedToDropdownOpen(true)}
                            onChange={(event) => {
                              setAssignedToSearchQuery(event.target.value);
                              setIsAssignedToDropdownOpen(true);

                              const matched = usersList.find(
                                  (u) =>
                                      `${u.fullName} (${u.userName || u.username || ''})`.toLowerCase() ===
                                      event.target.value.toLowerCase()
                              );

                              if (matched) {
                                setForm((current) => ({ ...current, assignedTo: String(matched.id) }));
                              } else {
                                setForm((current) => ({ ...current, assignedTo: '' }));
                              }
                            }}
                            placeholder="Chọn nhân viên..."
                            className="w-full border border-stone-300 rounded pl-3 pr-8 py-2 text-sm focus:border-[#bfa15f] outline-none"
                        />

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {form.assignedTo && (
                              <button
                                  type="button"
                                  onClick={() => {
                                    setAssignedToSearchQuery('');
                                    setForm((current) => ({ ...current, assignedTo: '' }));
                                  }}
                                  className="text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                          )}

                          <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {isAssignedToDropdownOpen && (
                          <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsAssignedToDropdownOpen(false)}
                            />

                            <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded border border-stone-200 bg-white py-1 shadow-lg">
                              <div
                                  onClick={() => {
                                    setForm((current) => ({ ...current, assignedTo: '' }));
                                    setIsAssignedToDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                      !form.assignedTo
                                          ? 'bg-stone-100 font-semibold text-[#bfa15f]'
                                          : 'text-slate-600'
                                  }`}
                              >
                                <span>Không chọn</span>
                                {!form.assignedTo && <Check size={12} className="text-[#bfa15f]" />}
                              </div>

                              {filteredAssignees.length > 0 ? (
                                  filteredAssignees.map((u) => {
                                    const isSelected = String(form.assignedTo) === String(u.id);

                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                              setForm((current) => ({ ...current, assignedTo: String(u.id) }));
                                              setIsAssignedToDropdownOpen(false);
                                            }}
                                            className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                                isSelected
                                                    ? 'bg-amber-50 font-semibold text-[#bfa15f]'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                <span>
                                  {u.fullName} ({u.userName || u.username || ''})
                                </span>
                                          {isSelected && <Check size={12} className="text-[#bfa15f]" />}
                                        </div>
                                    );
                                  })
                              ) : (
                                  <div className="px-3 py-1.5 text-xs text-slate-400 italic">
                                    Không tìm thấy nhân viên
                                  </div>
                              )}
                            </div>
                          </>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        {t('maintenance.modal.severity')}
                      </label>

                      <select
                          required
                          value={form.severity}
                          onChange={(e) => setForm((current) => ({ ...current, severity: e.target.value }))}
                          className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
                      >
                        {SEVERITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        {t('maintenance.modal.status')}
                      </label>

                      <select
                          required
                          value={form.status}
                          onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
                          className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      {t('maintenance.modal.diagnosis')}
                    </label>

                    <textarea
                        rows={2}
                        value={form.diagnosis}
                        onChange={(e) => setForm((current) => ({ ...current, diagnosis: e.target.value }))}
                        className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      {t('maintenance.modal.repairResult')}
                    </label>

                    <textarea
                        rows={2}
                        value={form.repairResult}
                        onChange={(e) => setForm((current) => ({ ...current, repairResult: e.target.value }))}
                        className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none"
                    />
                  </div>
                </>
            ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      {t('maintenance.modal.title')}
                    </label>

                    <input
                        required
                        value={form.issueTitle}
                        onChange={(e) => setForm((current) => ({ ...current, issueTitle: e.target.value }))}
                        className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none"
                        placeholder={t('maintenance.modal.titlePlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        {t('maintenance.modal.room')}
                      </label>

                      <div className="relative">
                        <input
                            type="text"
                            value={roomSearchQuery}
                            onFocus={() => setIsRoomDropdownOpen(true)}
                            onChange={(event) => {
                              setRoomSearchQuery(event.target.value);
                              setIsRoomDropdownOpen(true);

                              const matched = rooms.find(
                                  (r) =>
                                      `${r.roomNumber}${r.roomTypeName ? ` - ${r.roomTypeName}` : ''}`.toLowerCase() ===
                                      event.target.value.toLowerCase()
                              );

                              if (matched) {
                                setForm((current) => ({ ...current, roomId: String(matched.id) }));
                              } else {
                                setForm((current) => ({ ...current, roomId: '' }));
                              }
                            }}
                            placeholder="Chọn phòng..."
                            className="w-full border border-stone-300 rounded pl-3 pr-8 py-2 text-sm focus:border-[#bfa15f] outline-none"
                        />

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {form.roomId && (
                              <button
                                  type="button"
                                  onClick={() => {
                                    setRoomSearchQuery('');

                                    // SỬA:
                                    // Khi bỏ chọn phòng thì chỉ xóa roomId.
                                    // Không xóa equipmentId nữa vì có thể tạo request chỉ theo thiết bị.
                                    setForm((current) => ({ ...current, roomId: '' }));
                                  }}
                                  className="text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                          )}

                          <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {isRoomDropdownOpen && (
                          <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsRoomDropdownOpen(false)}
                            />

                            <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded border border-stone-200 bg-white py-1 shadow-lg">
                              <div
                                  onClick={() => {
                                    // SỬA:
                                    // Không chọn phòng thì chỉ clear roomId.
                                    // Không động vào equipmentId.
                                    setForm((current) => ({ ...current, roomId: '' }));
                                    setIsRoomDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                      !form.roomId
                                          ? 'bg-stone-100 font-semibold text-[#bfa15f]'
                                          : 'text-slate-600'
                                  }`}
                              >
                                <span>Không chọn</span>
                                {!form.roomId && <Check size={12} className="text-[#bfa15f]" />}
                              </div>

                              {filteredRooms.length > 0 ? (
                                  filteredRooms.map((room) => {
                                    const isSelected = String(form.roomId) === String(room.id);

                                    return (
                                        <div
                                            key={room.id}
                                            onClick={() => {
                                              // SỬA:
                                              // Chọn phòng chỉ set roomId.
                                              // Không kiểm tra currentEquip.roomId nữa.
                                              // Vì Equipment không còn roomId.
                                              setForm((current) => ({
                                                ...current,
                                                roomId: String(room.id),
                                              }));

                                              setIsRoomDropdownOpen(false);
                                            }}
                                            className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                                isSelected
                                                    ? 'bg-amber-50 font-semibold text-[#bfa15f]'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                <span>
                                  {room.roomNumber} {room.roomTypeName ? ` - ${room.roomTypeName}` : ''}
                                </span>

                                          {isSelected && <Check size={12} className="text-[#bfa15f]" />}
                                        </div>
                                    );
                                  })
                              ) : (
                                  <div className="px-3 py-1.5 text-xs text-slate-400 italic">
                                    Không tìm thấy phòng
                                  </div>
                              )}
                            </div>
                          </>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        {t('maintenance.modal.equipment')}
                      </label>

                      <div className="relative">
                        <input
                            type="text"
                            value={equipmentSearchQuery}
                            onFocus={() => setIsEquipmentDropdownOpen(true)}
                            onChange={(event) => {
                              setEquipmentSearchQuery(event.target.value);
                              setIsEquipmentDropdownOpen(true);

                              const matched = equipments.find(
                                  (e) =>
                                      `${e.equipmentName}${e.equipmentCode ? ` (${e.equipmentCode})` : ''}`.toLowerCase() ===
                                      event.target.value.toLowerCase()
                              );

                              if (matched) {
                                // SỬA:
                                // Chọn thiết bị chỉ set equipmentId.
                                // Không tự set roomId bằng matched.roomId nữa.
                                // Vì Equipment không còn roomId.
                                setForm((current) => ({
                                  ...current,
                                  equipmentId: String(matched.id),
                                }));
                              } else {
                                setForm((current) => ({ ...current, equipmentId: '' }));
                              }
                            }}
                            placeholder="Chọn thiết bị..."
                            className="w-full border border-stone-300 rounded pl-3 pr-8 py-2 text-sm focus:border-[#bfa15f] outline-none"
                        />

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {form.equipmentId && (
                              <button
                                  type="button"
                                  onClick={() => {
                                    setEquipmentSearchQuery('');
                                    setForm((current) => ({ ...current, equipmentId: '' }));
                                  }}
                                  className="text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                          )}

                          <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {isEquipmentDropdownOpen && (
                          <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsEquipmentDropdownOpen(false)}
                            />

                            <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded border border-stone-200 bg-white py-1 shadow-lg">
                              <div
                                  onClick={() => {
                                    setForm((current) => ({ ...current, equipmentId: '' }));
                                    setIsEquipmentDropdownOpen(false);
                                  }}
                                  className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                      !form.equipmentId
                                          ? 'bg-stone-100 font-semibold text-[#bfa15f]'
                                          : 'text-slate-600'
                                  }`}
                              >
                                <span>Không chọn</span>
                                {!form.equipmentId && <Check size={12} className="text-[#bfa15f]" />}
                              </div>

                              {filteredEquipments.length > 0 ? (
                                  filteredEquipments.map((equip) => {
                                    const isSelected = String(form.equipmentId) === String(equip.id);

                                    return (
                                        <div
                                            key={equip.id}
                                            onClick={() => {
                                              // SỬA:
                                              // Chọn thiết bị chỉ set equipmentId.
                                              // Không tự set roomId bằng equip.roomId.
                                              setForm((current) => ({
                                                ...current,
                                                equipmentId: String(equip.id),
                                              }));

                                              setIsEquipmentDropdownOpen(false);
                                            }}
                                            className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                                isSelected
                                                    ? 'bg-amber-50 font-semibold text-[#bfa15f]'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                <span>
                                  {equip.equipmentName} {equip.equipmentCode ? ` (${equip.equipmentCode})` : ''}
                                </span>

                                          {isSelected && <Check size={12} className="text-[#bfa15f]" />}
                                        </div>
                                    );
                                  })
                              ) : (
                                  <div className="px-3 py-1.5 text-xs text-slate-400 italic">
                                    Không tìm thấy thiết bị
                                  </div>
                              )}
                            </div>
                          </>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                        {t('maintenance.modal.reportedBy')}
                      </label>

                      <div className="relative">
                        <input
                            required
                            type="text"
                            value={reportedBySearchQuery}
                            onFocus={() => setIsReportedByDropdownOpen(true)}
                            onChange={(event) => {
                              setReportedBySearchQuery(event.target.value);
                              setIsReportedByDropdownOpen(true);

                              const matched = usersList.find(
                                  (u) =>
                                      `${u.fullName} (${u.userName || u.username || ''})`.toLowerCase() ===
                                      event.target.value.toLowerCase()
                              );

                              if (matched) {
                                setForm((current) => ({ ...current, reportedBy: String(matched.id) }));
                              } else {
                                setForm((current) => ({ ...current, reportedBy: '' }));
                              }
                            }}
                            placeholder="Chọn nhân viên..."
                            className="w-full border border-stone-300 rounded pl-3 pr-8 py-2 text-sm focus:border-[#bfa15f] outline-none"
                        />

                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {form.reportedBy && (
                              <button
                                  type="button"
                                  onClick={() => {
                                    setReportedBySearchQuery('');
                                    setForm((current) => ({ ...current, reportedBy: '' }));
                                  }}
                                  className="text-slate-400 hover:text-slate-600"
                              >
                                <X size={12} />
                              </button>
                          )}

                          <ChevronDown size={14} className="text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {isReportedByDropdownOpen && (
                          <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsReportedByDropdownOpen(false)}
                            />

                            <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded border border-stone-200 bg-white py-1 shadow-lg font-normal">
                              {filteredReporters.length > 0 ? (
                                  filteredReporters.map((u) => {
                                    const isSelected = String(form.reportedBy) === String(u.id);

                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                              setForm((current) => ({ ...current, reportedBy: String(u.id) }));
                                              setIsReportedByDropdownOpen(false);
                                            }}
                                            className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                                isSelected
                                                    ? 'bg-amber-50 font-semibold text-[#bfa15f]'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                <span>
                                  {u.fullName} ({u.userName || u.username || ''})
                                </span>

                                          {isSelected && <Check size={12} className="text-[#bfa15f]" />}
                                        </div>
                                    );
                                  })
                              ) : (
                                  <div className="px-3 py-1.5 text-xs text-slate-400 italic">
                                    Không tìm thấy nhân viên
                                  </div>
                              )}
                            </div>
                          </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      {t('maintenance.modal.severity')}
                    </label>

                    <select
                        required
                        value={form.severity}
                        onChange={(e) => setForm((current) => ({ ...current, severity: e.target.value }))}
                        className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
                    >
                      {SEVERITY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                      {t('maintenance.modal.description')}
                    </label>

                    <textarea
                        rows={3}
                        value={form.issueDescription}
                        onChange={(e) => setForm((current) => ({ ...current, issueDescription: e.target.value }))}
                        className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none"
                    />
                  </div>
                </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50"
              >
                {t('maintenance.modal.cancel')}
              </button>

              <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60"
              >
                {saving
                    ? t('maintenance.modal.saving')
                    : modal.editing
                        ? t('maintenance.modal.update')
                        : t('maintenance.modal.save')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
  );
}
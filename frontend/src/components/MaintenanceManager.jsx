import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Check, ChevronDown, X, Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { maintenanceService } from '../services/maintenanceService';
import { useLocale } from '../context/LocaleContext';
import { usePermission } from '../hooks/usePermission';
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
  estimatedCompletionTime: '',
};

const EMPTY_UPDATE = {
  assignedTo: '',
  severity: 'MEDIUM',
  status: 'PENDING',
  diagnosis: '',
  repairResult: '',
  estimatedCompletionTime: '',
};

const formatForDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  return isoString.substring(0, 16);
};

export default function MaintenanceManager({ readOnly = false }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission('MAINTENANCE_CREATE');
  const canUpdate = hasPermission('MAINTENANCE_UPDATE');
  const canDelete = hasPermission('MAINTENANCE_DELETE');

  const isReadOnly = readOnly || (!canCreate && !canUpdate && !canDelete);
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
  const [actionLoading, setActionLoading] = useState(null); // id đang xử lý accept/deny

  // Modal từ chối
  const [denyModal, setDenyModal] = useState({ open: false, item: null, reason: '' });
  // Modal checklist trước khi nhận việc
  const CHECKLIST_ITEMS = [
    'Đã đọc kỹ mô tả vấn đề và tình trạng sự cố',
    'Đã chuẩn bị dụng cụ và vật tư cần thiết',
    'Đã thông báo cho bộ phận liên quan (lễ tân / quản lý)',
    'Đã xác nhận vị trí phòng / thiết bị cần sửa',
    'Đã kiểm tra an toàn (điện, nước, khí gas nếu liên quan)',
  ];
  const [checklistModal, setChecklistModal] = useState({ open: false, item: null, checked: [] });

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

  useEffect(() => {
    if (form.roomId) {
      const selectedRoom = rooms.find((r) => String(r.id) === String(form.roomId));
      if (selectedRoom) {
        setRoomSearchQuery(`${selectedRoom.roomNumber}${selectedRoom.roomTypeName ? ` - ${selectedRoom.roomTypeName}` : ''}`);
      } else {
        setRoomSearchQuery(String(form.roomId));
      }
    } else {
      setRoomSearchQuery('');
    }
  }, [form.roomId, rooms]);

  useEffect(() => {
    if (form.equipmentId) {
      const selectedEquip = equipments.find((e) => String(e.id) === String(form.equipmentId));
      if (selectedEquip) {
        setEquipmentSearchQuery(`${selectedEquip.equipmentName}${selectedEquip.equipmentCode ? ` (${selectedEquip.equipmentCode})` : ''}`);
      } else {
        setEquipmentSearchQuery(String(form.equipmentId));
      }
    } else {
      setEquipmentSearchQuery('');
    }
  }, [form.equipmentId, equipments]);

  useEffect(() => {
    if (form.reportedBy) {
      const selectedReporter = usersList.find((u) => String(u.id) === String(form.reportedBy));
      if (selectedReporter) {
        setReportedBySearchQuery(`${selectedReporter.fullName} (${selectedReporter.userName || selectedReporter.username || ''})`);
      } else {
        setReportedBySearchQuery(String(form.reportedBy));
      }
    } else {
      setReportedBySearchQuery('');
    }
  }, [form.reportedBy, usersList]);

  useEffect(() => {
    if (form.assignedTo) {
      const selectedAssignee = usersList.find((u) => String(u.id) === String(form.assignedTo));
      if (selectedAssignee) {
        setAssignedToSearchQuery(`${selectedAssignee.fullName} (${selectedAssignee.userName || selectedAssignee.username || ''})`);
      } else {
        setAssignedToSearchQuery(String(form.assignedTo));
      }
    } else {
      setAssignedToSearchQuery('');
    }
  }, [form.assignedTo, usersList]);

  const filteredReporters = useMemo(() => {
    const query = reportedBySearchQuery.trim().toLowerCase();
    const staffUsers = usersList.filter(u => String(u.roleName).toUpperCase() !== 'CUSTOMER');
    if (!query) return staffUsers;

    const selectedReporter = staffUsers.find((u) => String(u.id) === String(form.reportedBy));
    const selectedLabel = selectedReporter ? `${selectedReporter.fullName} (${selectedReporter.userName || selectedReporter.username || ''})`.toLowerCase() : '';

    if (query === selectedLabel) {
      return staffUsers;
    }

    return staffUsers.filter((u) => {
      const name = (u.fullName || '').toLowerCase();
      const uname = (u.userName || u.username || '').toLowerCase();
      return name.includes(query) || uname.includes(query);
    });
  }, [usersList, reportedBySearchQuery, form.reportedBy]);

  const filteredAssignees = useMemo(() => {
    const query = assignedToSearchQuery.trim().toLowerCase();
    const maintenanceUsers = usersList.filter(u => String(u.roleName).toUpperCase() === 'MAINTENANCE');
    if (!query) return maintenanceUsers;

    const selectedAssignee = maintenanceUsers.find((u) => String(u.id) === String(form.assignedTo));
    const selectedLabel = selectedAssignee ? `${selectedAssignee.fullName} (${selectedAssignee.userName || selectedAssignee.username || ''})`.toLowerCase() : '';

    if (query === selectedLabel) {
      return maintenanceUsers;
    }

    return maintenanceUsers.filter((u) => {
      const name = (u.fullName || '').toLowerCase();
      const uname = (u.userName || u.username || '').toLowerCase();
      return name.includes(query) || uname.includes(query);
    });
  }, [usersList, assignedToSearchQuery, form.assignedTo]);

  const filteredRooms = useMemo(() => {
    let list = rooms;

    if (form.equipmentId) {
      const selectedEquip = equipments.find((e) => String(e.id) === String(form.equipmentId));
      if (selectedEquip && selectedEquip.assignedRooms) {
        const assignedRoomIds = selectedEquip.assignedRooms.map(ar => String(ar.roomId));
        list = list.filter((r) => assignedRoomIds.includes(String(r.id)));
      }
    }

    const query = roomSearchQuery.trim().toLowerCase();
    if (!query) return list;

    const selectedRoom = list.find((r) => String(r.id) === String(form.roomId));
    const selectedLabel = selectedRoom ? `${selectedRoom.roomNumber}${selectedRoom.roomTypeName ? ` - ${selectedRoom.roomTypeName}` : ''}`.toLowerCase() : '';

    if (query === selectedLabel) {
      return list;
    }

    return list.filter((room) => {
      const roomNum = String(room.roomNumber).toLowerCase();
      const typeName = (room.roomTypeName || '').toLowerCase();
      return roomNum.includes(query) || typeName.includes(query);
    });
  }, [rooms, roomSearchQuery, form.roomId, form.equipmentId, equipments]);

  const filteredEquipments = useMemo(() => {
    let list = equipments;

    if (form.roomId) {
      list = list.filter((e) => {
        if (!e.assignedRooms) return false;
        return e.assignedRooms.some(ar => String(ar.roomId) === String(form.roomId));
      });
    }

    const query = equipmentSearchQuery.trim().toLowerCase();
    if (!query) return list;

    const selectedEquip = list.find((e) => String(e.id) === String(form.equipmentId));
    const selectedLabel = selectedEquip ? `${selectedEquip.equipmentName}${selectedEquip.equipmentCode ? ` (${selectedEquip.equipmentCode})` : ''}`.toLowerCase() : '';

    if (query === selectedLabel) {
      return list;
    }

    return list.filter((equip) => {
      const name = (equip.equipmentName || '').toLowerCase();
      const code = (equip.equipmentCode || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [equipments, equipmentSearchQuery, form.equipmentId, form.roomId]);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

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

  const fetchData = useCallback(async (p = page) => {
    await fetchDataDirect(p, searchOpt, search, statusFilter);
  }, [page, searchOpt, search, statusFilter, fetchDataDirect]);

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
      estimatedCompletionTime: '',
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
      estimatedCompletionTime: formatForDateTimeLocal(item.estimatedCompletionTime),
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

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
          estimatedCompletionTime: form.estimatedCompletionTime ? form.estimatedCompletionTime : undefined,
        };
        await maintenanceService.update(modal.editing.id, payload);
        notify(t('maintenance.toast.updateSuccess'));
      } else {
        if (!form.reportedBy) {
          notify('Vui lòng chọn nhân viên báo cáo từ danh sách.', 'error');
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
          estimatedCompletionTime: form.estimatedCompletionTime ? form.estimatedCompletionTime : undefined,
        };
        await maintenanceService.create(payload);
        notify(t('maintenance.toast.addSuccess'));
      }
      closeModal();
      fetchData();
    } catch (e) {
      notify(e.status === 403 ? t('maintenance.toast.forbidden') : (e.message || t('maintenance.toast.loadError')), 'error');
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

  // ── Accept: mở modal checklist trước khi xác nhận ─────────────────────────────
  const openChecklist = (item) => {
    setChecklistModal({ open: true, item, checked: [] });
  };

  const handleChecklistToggle = (idx) => {
    setChecklistModal(prev => {
      const alreadyChecked = prev.checked.includes(idx);
      return {
        ...prev,
        checked: alreadyChecked ? prev.checked.filter(i => i !== idx) : [...prev.checked, idx],
      };
    });
  };

  const handleConfirmAccept = async () => {
    const item = checklistModal.item;
    setChecklistModal({ open: false, item: null, checked: [] });
    setActionLoading(item.id);
    try {
      await maintenanceService.acceptRequest(item.id, user?.id);
      notify('✅ Đã chấp nhận yêu cầu sửa chữa!');
      fetchData();
    } catch (e) {
      notify(e.message || 'Không thể chấp nhận yêu cầu', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Deny: mở modal xác nhận có lý do ──────────────────────────────────────────
  const openDenyModal = (item) => {
    setDenyModal({ open: true, item, reason: '' });
  };

  const handleConfirmDeny = async () => {
    const item = denyModal.item;
    const reason = denyModal.reason;
    setDenyModal({ open: false, item: null, reason: '' });
    setActionLoading(item.id);
    try {
      await maintenanceService.denyRequest(item.id, user?.id, reason);
      notify('Đã từ chối. Hệ thống đang tìm người thay thế...');
      fetchData();
    } catch (e) {
      notify(e.message || 'Không thể từ chối yêu cầu', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN') : '-';
  const formatDateTime = (dt) => {
    if (!dt) return '-';
    try {
      return new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '-';
    }
  };

  const rows = items.map(item => {
    const room = rooms.find(r => String(r.id) === String(item.roomId));
    const equip = equipments.find(e => String(e.id) === String(item.equipmentId));
    const reporter = usersList.find(u => String(u.id) === String(item.reportedBy));
    const assignee = usersList.find(u => String(u.id) === String(item.assignedTo));

    return (
      <tr key={item.id} className="hover:bg-stone-50">
        <td className="px-4 py-3 font-mono text-xs font-bold">#{item.id}</td>
        <td className="px-4 py-3 font-semibold text-sm">{item.issueTitle}</td>
        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{item.issueDescription || '-'}</td>
        <td className="px-4 py-3 text-xs">
          {room ? `Phòng ${room.roomNumber}` : (item.roomId ? `Phòng #${item.roomId}` : '-')}
        </td>
        <td className="px-4 py-3 text-xs">
          {equip ? `${equip.equipmentName} (${equip.equipmentCode})` : (item.equipmentId ? `TB #${item.equipmentId}` : '-')}
        </td>
        <td className="px-4 py-3 text-xs">
          {item.reportedByName || (reporter ? `${reporter.fullName} (${reporter.userName || reporter.username || ''})` : (item.reportedBy || '-'))}
        </td>
        <td className="px-4 py-3 text-xs">
          {item.assignedToName || (assignee ? `${assignee.fullName} (${assignee.userName || assignee.username || ''})` : (item.assignedTo || '-'))}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.MEDIUM}`}>
            {t(`maintenance.severity.${item.severity || 'MEDIUM'}`)}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || STATUS_COLORS.PENDING}`}>
            {t(`maintenance.status.${item.status || 'PENDING'}`)}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-slate-400">{formatDate(item.createdAt)}</td>
        <td className="px-4 py-3 text-xs text-slate-500 font-semibold">{formatDateTime(item.estimatedCompletionTime)}</td>
        <td className="px-4 py-3 text-xs text-emerald-600 font-semibold">{formatDateTime(item.completedAt)}</td>
        {!isReadOnly && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              {item.status === 'ASSIGNED' && String(item.assignedTo) === String(user?.id) && (
                <>
                  <button
                    onClick={() => openChecklist(item)}
                    disabled={actionLoading === item.id}
                    title="Chấp nhận"
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors"
                  >
                    {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Nhận
                  </button>
                  <button
                    onClick={() => openDenyModal(item)}
                    disabled={actionLoading === item.id}
                    title="Từ chối"
                    className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60 transition-colors"
                  >
                    {actionLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Từ chối
                  </button>
                </>
              )}
              {canUpdate && <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Chỉnh sửa"><Edit2 size={15} /></button>}
              {canDelete && <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" title="Xóa"><Trash2 size={15} /></button>}
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
    'Dự kiến xong',
    'Hoàn thành',
    ...(!isReadOnly ? [t('maintenance.columns.actions')] : [])
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
              placeholder={t(`maintenance.placeholders.${searchOpt}`) || t('maintenance.searchPlaceholder') || 'Tìm kiếm...'}
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
            {STATUS_OPTIONS.map(opt => (
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

        {!isReadOnly && (
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

      <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} emptyText={t('maintenance.emptyText')} />

      <Modal open={modal.open} title={modal.editing ? t('maintenance.modal.editTitle') : t('maintenance.modal.addTitle')} onClose={closeModal} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {modal.editing ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.assignedTo')}</label>
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
                            !form.assignedTo ? 'bg-stone-100 font-semibold text-[#bfa15f]' : 'text-slate-600'
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
                                  isSelected ? 'bg-amber-50 font-semibold text-[#bfa15f]' : 'text-slate-700'
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.severity')}</label>
                  <select required value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                    {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.status')}</label>
                  <select required value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Thời gian dự kiến hoàn thành</label>
                  <input
                    type="datetime-local"
                    value={form.estimatedCompletionTime}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedCompletionTime: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
                  />
                </div>
                {modal.editing?.completedAt && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Thời gian hoàn thành thực tế</label>
                    <input
                      disabled
                      type="text"
                      value={new Date(modal.editing.completedAt).toLocaleString('vi-VN')}
                      className="w-full border border-stone-200 bg-stone-50 rounded px-3 py-2 text-sm outline-none text-slate-500 cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.diagnosis')}</label>
                <textarea rows={2} value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.repairResult')}</label>
                <textarea rows={2} value={form.repairResult} onChange={e => setForm(f => ({ ...f, repairResult: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.title')}</label>
                <input required value={form.issueTitle} onChange={e => setForm(f => ({ ...f, issueTitle: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder={t('maintenance.modal.titlePlaceholder')} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.room')}</label>
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
                            setForm((current) => ({ ...current, roomId: '', equipmentId: '' }));
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
                            setForm((current) => ({ ...current, roomId: '', equipmentId: '' }));
                            setIsRoomDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                            !form.roomId ? 'bg-stone-100 font-semibold text-[#bfa15f]' : 'text-slate-600'
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
                                  setForm((current) => {
                                    const updated = { ...current, roomId: String(room.id) };
                                    const currentEquip = equipments.find((e) => String(e.id) === String(current.equipmentId));
                                    if (currentEquip && currentEquip.assignedRooms) {
                                      const isAssignedToNewRoom = currentEquip.assignedRooms.some(ar => String(ar.roomId) === String(room.id));
                                      if (!isAssignedToNewRoom) {
                                        updated.equipmentId = '';
                                      }
                                    }
                                    return updated;
                                  });
                                  setIsRoomDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                  isSelected ? 'bg-amber-50 font-semibold text-[#bfa15f]' : 'text-slate-700'
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.equipment')}</label>
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
                          setForm((current) => {
                            const updated = { ...current, equipmentId: String(matched.id) };
                            const hasMatchedRoom = matched.assignedRooms && matched.assignedRooms.some(ar => String(ar.roomId) === String(current.roomId));
                            if (!hasMatchedRoom && matched.assignedRooms && matched.assignedRooms.length > 0) {
                              updated.roomId = String(matched.assignedRooms[0].roomId);
                            }
                            return updated;
                          });
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
                            !form.equipmentId ? 'bg-stone-100 font-semibold text-[#bfa15f]' : 'text-slate-600'
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
                                  setForm((current) => {
                                    const updated = { ...current, equipmentId: String(equip.id) };
                                    const hasMatchedRoom = equip.assignedRooms && equip.assignedRooms.some(ar => String(ar.roomId) === String(current.roomId));
                                    if (!hasMatchedRoom && equip.assignedRooms && equip.assignedRooms.length > 0) {
                                      updated.roomId = String(equip.assignedRooms[0].roomId);
                                    }
                                    return updated;
                                  });
                                  setIsEquipmentDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between cursor-pointer px-3 py-1.5 text-xs hover:bg-stone-50 ${
                                  isSelected ? 'bg-amber-50 font-semibold text-[#bfa15f]' : 'text-slate-700'
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.reportedBy')}</label>
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
                                  isSelected ? 'bg-amber-50 font-semibold text-[#bfa15f]' : 'text-slate-700'
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.severity')}</label>
                  <select required value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                    {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Thời gian dự kiến hoàn thành</label>
                  <input
                    type="datetime-local"
                    value={form.estimatedCompletionTime}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedCompletionTime: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.description')}</label>
                <textarea rows={3} value={form.issueDescription} onChange={e => setForm(f => ({ ...f, issueDescription: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t('maintenance.modal.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? t('maintenance.modal.saving') : modal.editing ? t('maintenance.modal.update') : t('maintenance.modal.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Từ Chối ─────────────────────────────────────────────────── */}
      {denyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDenyModal({ open: false, item: null, reason: '' })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <XCircle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Từ chối yêu cầu</h3>
                  <p className="text-red-100 text-sm">Yêu cầu #{denyModal.item?.id}</p>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                <p className="font-semibold mb-1">⚠️ Lưu ý:</p>
                <p>Sau khi từ chối, hệ thống sẽ tự động tìm nhân viên khác thay thế. Bạn sẽ không còn thấy yêu cầu này.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Lý do từ chối <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                </label>
                <textarea
                  rows={3}
                  value={denyModal.reason}
                  onChange={e => setDenyModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ví dụ: Thiếu dụng cụ chuyên dụng, đang bận việc khác..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none transition-all"
                />
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setDenyModal({ open: false, item: null, reason: '' })}
                className="flex-1 px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-600 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDeny}
                className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold shadow transition-all"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Checklist Trước Khi Nhận Việc ──────────────────────────── */}
      {checklistModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setChecklistModal({ open: false, item: null, checked: [] })} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Checklist chuẩn bị sửa chữa</h3>
                  <p className="text-emerald-100 text-sm">Yêu cầu #{checklistModal.item?.id} — {checklistModal.item?.issueTitle}</p>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-500 mb-4">Vui lòng xác nhận các mục sau trước khi bắt đầu công việc:</p>
              {CHECKLIST_ITEMS.map((item, idx) => {
                const isChecked = checklistModal.checked.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChecklistToggle(idx)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      isChecked
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isChecked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                    }`}>
                      {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-medium ${isChecked ? 'text-emerald-700' : 'text-slate-600'}`}>{item}</span>
                  </button>
                );
              })}
              {/* Progress */}
              <div className="mt-4 bg-slate-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(checklistModal.checked.length / CHECKLIST_ITEMS.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                {checklistModal.checked.length}/{CHECKLIST_ITEMS.length} mục đã xác nhận
              </p>
            </div>
            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setChecklistModal({ open: false, item: null, checked: [] })}
                className="flex-1 px-4 py-2.5 text-sm border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-600 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={checklistModal.checked.length < CHECKLIST_ITEMS.length}
                className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checklistModal.checked.length < CHECKLIST_ITEMS.length
                  ? `Còn ${CHECKLIST_ITEMS.length - checklistModal.checked.length} mục chưa tick`
                  : '✓ Xác nhận bắt đầu sửa chữa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, RefreshCw, Trash2, Pencil, Eye,
    AlertTriangle, ChevronLeft, ChevronRight, X, Check,
    Clock, CheckCircle2, XCircle, Loader2, History,
    BedDouble, User, SortAsc, SortDesc,
    LayoutGrid, TableIcon, Wrench, ClipboardList,
    Minus, FileText, Loader,
} from 'lucide-react';
import Toast from './shared/Toast';
import { housekeepingService } from '../services/housekeepingService';
import { useLocale } from '../context/LocaleContext';
import { getUsers } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
// ─── Constants ────────────────────────────────────────────────────────────────
const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const SORT_FIELDS = ['ID', 'ROOM_ID', 'ASSIGNED_TO_ID', 'STATUS', 'CREATED_AT'];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const STATUS_CONFIG = {
    PENDING: { label: 'Chờ xử lý', labelEn: 'Pending', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', icon: Clock },
    IN_PROGRESS: { label: 'Đang làm', labelEn: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: Loader2 },
    COMPLETED: { label: 'Hoàn thành', labelEn: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
    CANCELLED: { label: 'Đã hủy', labelEn: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', icon: XCircle },
};
// ─── Sub-Components ───────────────────────────────────────────────────────────
const WORK_STATUS_CONFIG = {
    AVAILABLE: { label: 'Sẵn sàng', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    WORKING: { label: 'Đang làm việc', className: 'text-amber-700 bg-amber-50 border-amber-200' },
    OFF: { label: 'Đang nghỉ', className: 'text-slate-600 bg-slate-50 border-slate-200' },
};

const WorkStatusBadge = ({ status }) => {
    const cfg = WORK_STATUS_CONFIG[status || 'AVAILABLE'] || WORK_STATUS_CONFIG.AVAILABLE;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.className}`}>
            {cfg.label}
        </span>
    );
};

/** Skeleton loading row */
const SkeletonRow = () => (
    <tr className="animate-pulse">
        {[...Array(7)].map((_, i) => (
            <td key={i} className="px-4 py-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
            </td>
        ))}
    </tr>
);
/** Status badge with colored dot */
const StatusBadge = ({ status, locale }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
    const Ic = cfg.icon || Clock;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {locale === 'en' ? cfg.labelEn : cfg.label}
        </span>
    );
};
/** Confirm Delete Modal */
const DeleteConfirmModal = ({ task, onConfirm, onClose, loading }) => (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Xác nhận xóa tác vụ</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Tác vụ <span className="font-semibold text-slate-700">#{task?.id}</span> – Phòng <span className="font-semibold text-slate-700">{task?.roomNumber || task?.roomId}</span> sẽ bị xóa vĩnh viễn.
                    </p>
                </div>
            </div>
            <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                    Hủy
                </button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Xóa tác vụ
                </button>
            </div>
        </div>
    </div>
);
/** Task Detail Drawer (side panel) */
// readOnly: if true, hides edit button
// readOnly: if true, hides edit button
const TaskDetailDrawer = ({
    task,
    onClose,
    onEdit,
    onUpdateStatus,
    onReportMinibar,
    onReportIssue,
    locale,
    readOnly = false,
    actionLoading = false
}) => {
    if (!task) return null;

    const nextActions = {
        PENDING: { label: 'Nhận việc', labelEn: 'Accept', nextStatus: 'IN_PROGRESS', btnClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
        IN_PROGRESS: { label: 'Hoàn thành', labelEn: 'Complete', nextStatus: 'COMPLETED', btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white' }
    };

    const nextAction = nextActions[task.status];

    return (
        <div className="fixed inset-0 z-[60] flex">
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <ClipboardList size={20} className="text-[#bfa15f]" /> Chi tiết tác vụ #{task.id}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-5 flex-1">
                    <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl">
                        <BedDouble size={20} className="text-[#bfa15f] shrink-0" />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Số phòng</p>
                            <p className="font-bold text-slate-800">{task.roomNumber || `ID: ${task.roomId}`}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-stone-50 rounded-xl">
                            <p className="text-xs text-slate-400 font-medium mb-1">Trạng thái</p>
                            <StatusBadge status={task.status} locale={locale} />
                        </div>
                        <div className="p-4 bg-stone-50 rounded-xl">
                            <p className="text-xs text-slate-400 font-medium mb-1">Ngày tạo</p>
                            <p className="text-sm font-semibold text-slate-700">
                                {task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : '—'}
                            </p>
                        </div>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-[#bfa15f]" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nhân sự</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Người thực hiện</p>
                                <p className="font-semibold text-slate-700">{task.assignedToName || `#${task.assignedToId}` || '—'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Người giao</p>
                                <p className="font-semibold text-slate-700">{task.assignedByName || `#${task.assignedById}` || '—'}</p>
                            </div>
                        </div>
                    </div>
                    {task.notes && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                            <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-2">Ghi chú</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{task.notes}</p>
                        </div>
                    )}

                    {readOnly && (
                        <div className="pt-4 border-t border-stone-100 space-y-3">
                            {nextAction && (
                                <button
                                    onClick={() => onUpdateStatus(task.id, nextAction.nextStatus)}
                                    disabled={actionLoading}
                                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 ${nextAction.btnClass}`}
                                >
                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    {locale === 'en' ? nextAction.labelEn : nextAction.label}
                                </button>
                            )}

                            {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
                                <button
                                    onClick={() => onUpdateStatus(task.id, 'CANCELLED')}
                                    disabled={actionLoading}
                                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                                >
                                    <X size={16} /> {locale === 'en' ? 'Cancel' : 'Hủy việc'}
                                </button>
                            )}

                            {task.status === 'IN_PROGRESS' && (
                                <button
                                    onClick={() => onReportMinibar(task)}
                                    className="w-full py-3 flex items-center justify-center gap-2 bg-[#bfa15f] hover:bg-[#a3874c] text-white rounded-xl text-sm font-bold transition-all shadow-sm"
                                >
                                    <FileText size={16} /> Kê khai & Báo cáo Minibar
                                </button>
                            )}

                            <button
                                onClick={() => onReportIssue(task.roomId)}
                                className="w-full py-3 flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                            >
                                <AlertTriangle size={15} /> Báo cáo sự cố phòng này
                            </button>
                        </div>
                    )}
                </div>
                {!readOnly && (
                    <div className="p-6 border-t border-stone-100">
                        <button
                            onClick={() => onEdit(task)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#bfa15f] text-white rounded-xl font-semibold hover:bg-[#a8893f] transition-colors"
                        >
                            <Pencil size={16} /> Chỉnh sửa tác vụ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
/** Task Create / Edit Modal */
const TaskFormModal = ({ task, housekeepers, onSubmit, onClose, loading }) => {
    const isEdit = Boolean(task?.id);
    const [form, setForm] = useState({
        roomId: task?.roomId ?? '',
        assignedToId: task?.assignedToId ?? '',
        status: task?.status ?? 'PENDING',
        notes: task?.notes ?? '',
    });
    const [errors, setErrors] = useState({});
    const validate = () => {
        const errs = {};
        if (!form.roomId) errs.roomId = 'Vui lòng nhập ID phòng';
        if (!form.assignedToId) errs.assignedToId = 'Vui lòng chọn nhân viên';
        return errs;
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSubmit({ ...form, roomId: Number(form.roomId), assignedToId: Number(form.assignedToId) });
    };
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 fade-in duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {isEdit ? <Pencil size={18} className="text-[#bfa15f]" /> : <Plus size={18} className="text-[#bfa15f]" />}
                        {isEdit ? `Cập nhật tác vụ #${task.id}` : 'Tạo tác vụ mới'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Room ID */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Số phòng (ID) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="roomId"
                            value={form.roomId}
                            onChange={handleChange}
                            placeholder="Nhập ID phòng..."
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:border-[#bfa15f] ${errors.roomId ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                        />
                        {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>}
                    </div>
                    {/* Assigned To */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Nhân viên thực hiện <span className="text-red-500">*</span>
                        </label>
                        {housekeepers.length > 0 ? (
                            <select
                                name="assignedToId"
                                value={form.assignedToId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:border-[#bfa15f] ${errors.assignedToId ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                            >
                                <option value="">Chọn nhân viên...</option>
                                {housekeepers.map(h => {
                                    const workStatus = h.workStatus || 'AVAILABLE';
                                    const label = WORK_STATUS_CONFIG[workStatus]?.label || workStatus;
                                    return (
                                        <option key={h.id} value={h.id} disabled={workStatus === 'OFF'}>
                                            {h.fullName} (#{h.id}) - {label}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <input
                                type="number"
                                name="assignedToId"
                                value={form.assignedToId}
                                onChange={handleChange}
                                placeholder="Nhập ID nhân viên..."
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:border-[#bfa15f] ${errors.assignedToId ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                            />
                        )}
                        {errors.assignedToId && <p className="text-red-500 text-xs mt-1">{errors.assignedToId}</p>}
                    </div>
                    {/* Status (edit only) */}
                    {isEdit && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Trạng thái</label>
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f]"
                            >
                                {TASK_STATUSES.map(s => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ghi chú</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Ghi chú thêm về tác vụ..."
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f] resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-stone-50 transition-colors">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-[#bfa15f] text-white rounded-xl text-sm font-semibold hover:bg-[#a8893f] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : (isEdit ? <Check size={16} /> : <Plus size={16} />)}
                            {isEdit ? 'Cập nhật' : 'Tạo tác vụ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
/** Report Room Issue Modal */
const ReportIssueModal = ({ defaultRoomId = '', onSubmit, onClose, loading }) => {
    const [form, setForm] = useState({ roomId: defaultRoomId, issueDescription: '', severity: 'MEDIUM' });
    const [errors, setErrors] = useState({});
    const validate = () => {
        const errs = {};
        if (!form.roomId) errs.roomId = 'Vui lòng nhập ID phòng';
        if (!form.issueDescription) errs.issueDescription = 'Vui lòng mô tả sự cố';
        return errs;
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSubmit(Number(form.roomId), { issueDescription: form.issueDescription, severity: form.severity });
    };
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Wrench size={18} className="text-red-500" /> Báo cáo sự cố phòng
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">ID Phòng <span className="text-red-500">*</span></label>
                        <input
                            type="number" name="roomId" value={form.roomId} onChange={handleChange}
                            placeholder="Nhập ID phòng gặp sự cố..."
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:border-[#bfa15f] ${errors.roomId ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                        />
                        {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mức độ nghiêm trọng</label>
                        <select name="severity" value={form.severity} onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f]">
                            <option value="LOW">🟢 Thấp</option>
                            <option value="MEDIUM">🟡 Trung bình</option>
                            <option value="HIGH">🟠 Cao</option>
                            <option value="CRITICAL">🔴 Khẩn cấp</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mô tả sự cố <span className="text-red-500">*</span></label>
                        <textarea
                            name="issueDescription" value={form.issueDescription} onChange={handleChange}
                            rows={4} placeholder="Ví dụ: Điều hòa không hoạt động, vòi sen bị rỉ nước..."
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none resize-none focus:border-[#bfa15f] ${errors.issueDescription ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                        />
                        {errors.issueDescription && <p className="text-red-500 text-xs mt-1">{errors.issueDescription}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-stone-50 transition-colors">Hủy</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
                            Gửi báo cáo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/** Minibar Report Modal */
const MinibarReportMiniModal = ({ task, onSubmit, onClose, loading }) => {
    const [quantities, setQuantities] = useState({ water: 0, cola: 0, beer: 0, snack: 0 });

    const handleUpdateQuantity = (item, delta) => {
        setQuantities(prev => {
            const val = Math.max(0, (prev[item] || 0) + delta);
            return { ...prev, [item]: val };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(task.id, quantities);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BedDouble size={18} className="text-[#bfa15f]" /> Kê khai Minibar - Phòng {task.roomNumber || task.roomId}
                    </h3>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 text-slate-400"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-xs text-slate-500">Vui lòng kiểm tra thực tế trong phòng và nhập số lượng đồ uống đã tiêu thụ.</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between p-2 border rounded-xl bg-white">
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">Nước suối Aquafina</p>
                                <p className="text-xs text-slate-400">10,000 VND</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleUpdateQuantity('water', -1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Minus size={14} /></button>
                                <span className="w-5 text-center font-bold text-sm">{quantities.water}</span>
                                <button type="button" onClick={() => handleUpdateQuantity('water', 1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Plus size={14} /></button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-xl bg-white">
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">Coca-Cola / Pepsi</p>
                                <p className="text-xs text-slate-400">20,000 VND</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleUpdateQuantity('cola', -1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Minus size={14} /></button>
                                <span className="w-5 text-center font-bold text-sm">{quantities.cola}</span>
                                <button type="button" onClick={() => handleUpdateQuantity('cola', 1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Plus size={14} /></button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-xl bg-white">
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">Bia Heineken</p>
                                <p className="text-xs text-slate-400">35,000 VND</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleUpdateQuantity('beer', -1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Minus size={14} /></button>
                                <span className="w-5 text-center font-bold text-sm">{quantities.beer}</span>
                                <button type="button" onClick={() => handleUpdateQuantity('beer', 1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Plus size={14} /></button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 border rounded-xl bg-white">
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">Snack khoai tây</p>
                                <p className="text-xs text-slate-400">15,000 VND</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => handleUpdateQuantity('snack', -1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Minus size={14} /></button>
                                <span className="w-5 text-center font-bold text-sm">{quantities.snack}</span>
                                <button type="button" onClick={() => handleUpdateQuantity('snack', 1)} className="p-1 rounded bg-stone-100 hover:bg-stone-200"><Plus size={14} /></button>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-bold text-slate-600">Hủy</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-[#bfa15f] hover:bg-[#a3874c] text-white rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Gửi báo cáo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
/** Room State History Modal */
const RoomHistoryModal = ({ onClose }) => {
    const [roomId, setRoomId] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const { locale } = useLocale();
    const fetchHistory = async (e) => {
        e?.preventDefault();
        if (!roomId) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await housekeepingService.getRoomStateHistory(roomId, { page: 0, size: 20, sortBy: 'ID', direction: 'DESC' }, locale);
            setHistory(res?.data?.content || []);
        } catch {
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 shrink-0">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <History size={18} className="text-[#bfa15f]" /> Lịch sử trạng thái phòng
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-6 shrink-0">
                    <form onSubmit={fetchHistory} className="flex gap-2">
                        <input
                            type="number" value={roomId} onChange={e => setRoomId(e.target.value)}
                            placeholder="Nhập ID phòng..."
                            className="flex-1 px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f]"
                        />
                        <button type="submit" className="px-4 py-2.5 bg-[#bfa15f] text-white rounded-lg text-sm font-semibold hover:bg-[#a8893f] transition-colors flex items-center gap-2">
                            <Search size={16} /> Xem
                        </button>
                    </form>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-[#bfa15f]" />
                        </div>
                    ) : history.length === 0 && searched ? (
                        <p className="text-center text-slate-400 py-12">Không có lịch sử cho phòng này</p>
                    ) : history.length > 0 ? (
                        <div className="relative pl-6">
                            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-stone-200" />
                            {history.map((item, idx) => (
                                <div key={item.id || idx} className="relative mb-5 last:mb-0">
                                    <div className="absolute -left-3.5 top-1.5 w-3 h-3 rounded-full bg-[#bfa15f] border-2 border-white shadow" />
                                    <div className="bg-stone-50 rounded-xl p-4 ml-2">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <StatusBadge status={item.newStatus || item.status} locale={locale} />
                                            <span className="text-xs text-slate-400">
                                                {item.changedAt ? new Date(item.changedAt).toLocaleString('vi-VN') : '—'}
                                            </span>
                                        </div>
                                        {item.changedByName && (
                                            <p className="text-xs text-slate-500 mt-2">Bởi: <span className="font-semibold">{item.changedByName}</span></p>
                                        )}
                                        {item.note && <p className="text-xs text-slate-600 mt-1 italic">"{item.note}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
/** Kanban Column */
const KanbanColumn = ({ status, tasks, onView, locale, readOnly = false }) => {
    const cfg = STATUS_CONFIG[status] || {};
    return (
        <div className="flex flex-col bg-stone-50 rounded-2xl border border-stone-200 min-h-[300px]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="font-bold text-sm text-slate-700">{locale === 'en' ? cfg.labelEn : cfg.label}</span>
                <span className="ml-auto bg-white border border-stone-200 text-xs font-bold text-slate-500 rounded-full px-2 py-0.5">{tasks.length}</span>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[60vh]">
                {tasks.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs py-8 italic">Không có tác vụ</p>
                ) : tasks.map(task => (
                    <div key={task.id}
                        className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-[#bfa15f]/40 transition-all cursor-pointer group"
                        onClick={() => onView(task)}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <BedDouble size={13} className="text-[#bfa15f] shrink-0" />
                                    <span className="font-bold text-slate-800 text-sm truncate">
                                        Phòng {task.roomNumber || `#${task.roomId}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <User size={11} className="shrink-0" />
                                    <span className="truncate">{task.assignedToName || `NV #${task.assignedToId}`}</span>
                                </div>
                                <div className="mt-1">
                                    <WorkStatusBadge status={task.assignedToWorkStatus} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
// ─── Main Component ───────────────────────────────────────────────────────────
export default function HousekeepingManager({ readOnly = false }) {
    const { user } = useAuth();
    const { locale } = useLocale();
    const { hasPermission } = usePermission();
    // ── State: Data ──────────────────────────────────────────────────────────
    const [tasks, setTasks] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [housekeepers, setHousekeepers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState({ type: 'success', message: '' });
    // ── State: View ──────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
    // ── State: Filters & Pagination ──────────────────────────────────────────
    const [filters, setFilters] = useState({
        status: '',
        assignedToId: '',
        assignedById: '',
        roomId: '',
    });
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState('ID');
    const [direction, setDirection] = useState('ASC');
    // ── State: Modals ────────────────────────────────────────────────────────
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showMinibarModal, setShowMinibarModal] = useState(false);
    const [minibarTask, setMinibarTask] = useState(null);
    const [reportRoomId, setReportRoomId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const notify = (message, type = 'success') => setToast({ type, message });
    // ── Normalize backend response field names ───────────────────────────────
    // Backend may return "taskStatus" instead of "status", handle gracefully
    const normalizeTask = (t) => ({
        ...t,
        status: t.status || t.taskStatus || t.state || '',
        roomId: t.roomId || t.room?.id,
        roomNumber: t.roomNumber || t.room?.roomNumber || t.room?.number,
        assignedToId: t.assignedToId || t.assignedTo?.id,
        assignedToName: t.assignedToName || t.assignedTo?.fullName || t.assignedTo?.name,
        assignedToWorkStatus: t.assignedToWorkStatus || t.assignedTo?.workStatus || 'AVAILABLE',
        assignedById: t.assignedById || t.assignedBy?.id,
        assignedByName: t.assignedByName || t.assignedBy?.fullName || t.assignedBy?.name,
        notes: t.notes || t.description || t.note || '',
        createdAt: t.createdAt || t.createAt || t.created_at || '',
    });
    // ── Fetch Tasks ──────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page,
                size: pageSize,
                sortBy,
                direction,
            };
            const res = await housekeepingService.searchTasks(params, locale);
            const pageData = res?.data;
            setTasks((pageData?.content || []).map(normalizeTask));
            setTotalPages(pageData?.totalPages || 0);
            setTotalElements(pageData?.totalElements || 0);
        } catch (err) {
            notify(err?.message || 'Không thể tải danh sách tác vụ', 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, page, pageSize, sortBy, direction, locale]);
    // ── Fetch Housekeepers (for dropdown) ────────────────────────────────────
    const fetchHousekeepers = useCallback(async () => {
        try {
            const res = await getUsers({ roleName: 'HOUSEKEEPER', size: 100 }, locale);
            setHousekeepers(res?.data?.content || res?.data || []);
        } catch {
            // silently fail — input field fallback will handle
        }
    }, [locale]);
    useEffect(() => { fetchTasks(); }, [fetchTasks]);
    useEffect(() => { fetchHousekeepers(); }, [fetchHousekeepers]);

    useEffect(() => {
        if (readOnly && user?.id) {
            setFilters(prev => ({ ...prev, assignedToId: user.id }));
        }
    }, [readOnly, user?.id]);

    // ── Filter change resets page ────────────────────────────────────────────
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };
    const handleSearch = (e) => { e.preventDefault(); setPage(0); fetchTasks(); };
    const handleResetFilters = () => {
        setFilters({ status: '', assignedToId: readOnly && user?.id ? user.id : '', assignedById: '', roomId: '' });
        setPage(0);
    };
    // ── Handlers: CRUD ───────────────────────────────────────────────────────
    const handleCreateTask = async (formData) => {
        setActionLoading(true);
        try {
            const payload = {
                ...formData,
                assignedById: user?.id
            };
            const res = await housekeepingService.createTask(payload, locale);
            notify(res?.message || 'Tạo tác vụ thành công!');
            setShowCreateModal(false);
            fetchTasks();
        } catch (err) {
            notify(err?.message || 'Tạo tác vụ thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    const handleUpdateTask = async (formData) => {
        setActionLoading(true);
        try {
            const res = await housekeepingService.updateTask(selectedTask.id, formData, locale);
            notify(res?.message || 'Cập nhật tác vụ thành công!');
            setShowEditModal(false);
            setSelectedTask(null);
            fetchTasks();
        } catch (err) {
            notify(err?.message || 'Cập nhật tác vụ thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    const handleDeleteTask = async () => {
        setActionLoading(true);
        try {
            const res = await housekeepingService.deleteTask(selectedTask.id, locale);
            notify(res?.message || 'Đã xóa tác vụ!');
            setShowDeleteModal(false);
            setSelectedTask(null);
            fetchTasks();
        } catch (err) {
            notify(err?.message || 'Xóa tác vụ thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    const handleUpdateStatus = async (taskId, newStatus) => {
        setActionLoading(true);
        try {
            const res = await housekeepingService.updateTask(taskId, { status: newStatus }, locale);
            notify(res?.message || 'Cập nhật trạng thái thành công!');
            fetchTasks();
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            notify(err?.message || 'Cập nhật thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    const handleReportMinibar = async (taskId, quantities) => {
        setActionLoading(true);
        try {
            const res = await housekeepingService.reportMinibar(taskId, quantities, locale);
            notify(res?.message || 'Đã gửi báo cáo tiêu dùng Minibar thành công!');
            setShowMinibarModal(false);
            setMinibarTask(null);
        } catch (err) {
            notify(err?.message || 'Không tìm thấy đặt phòng hoặc gửi thất bại.', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    const handleReportIssue = async (roomId, payload) => {
        setActionLoading(true);
        try {
            const res = await housekeepingService.reportRoomIssue(roomId, {
                ...payload,
                reportedById: user?.id
            }, locale);
            notify(res?.message || 'Đã gửi báo cáo sự cố!');
            setShowIssueModal(false);
            setReportRoomId(null);
        } catch (err) {
            notify(err?.message || 'Gửi báo cáo thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };
    // ── Helpers for views ────────────────────────────────────────────────────
    const openEdit = (task) => {
        setSelectedTask(task);
        setShowDetailDrawer(false);
        setShowEditModal(true);
    };
    const openDelete = (task) => { setSelectedTask(task); setShowDeleteModal(true); };
    const openDetail = (task) => { setSelectedTask(task); setShowDetailDrawer(true); };
    const toggleSort = (field) => {
        if (sortBy === field) setDirection(d => d === 'ASC' ? 'DESC' : 'ASC');
        else { setSortBy(field); setDirection('ASC'); }
    };
    // ── Kanban data ──────────────────────────────────────────────────────────
    const kanbanGroups = TASK_STATUSES.reduce((acc, s) => {
        acc[s] = tasks.filter(t => t.status === s);
        return acc;
    }, {});
    // ── Summary stats ────────────────────────────────────────────────────────
    const stats = TASK_STATUSES.map(s => ({
        status: s,
        count: tasks.filter(t => t.status === s).length,
    }));
    return (
        <div className="space-y-5">
            <Toast type={toast.type} message={toast.message} onClose={() => setToast(p => ({ ...p, message: '' }))} />
            {/* ── Modals ─────────────────────────────────────────────────────────── */}
            {showCreateModal && (
                <TaskFormModal task={null} housekeepers={housekeepers} rooms={[]}
                    onSubmit={handleCreateTask} onClose={() => setShowCreateModal(false)} loading={actionLoading} />
            )}
            {showEditModal && selectedTask && (
                <TaskFormModal task={selectedTask} housekeepers={housekeepers} rooms={[]}
                    onSubmit={handleUpdateTask} onClose={() => { setShowEditModal(false); setSelectedTask(null); }} loading={actionLoading} />
            )}
            {showDeleteModal && selectedTask && (
                <DeleteConfirmModal task={selectedTask}
                    onConfirm={handleDeleteTask} onClose={() => { setShowDeleteModal(false); setSelectedTask(null); }} loading={actionLoading} />
            )}
            {showDetailDrawer && selectedTask && (
                <TaskDetailDrawer
                    task={selectedTask}
                    onClose={() => setShowDetailDrawer(false)}
                    onEdit={openEdit}
                    onUpdateStatus={handleUpdateStatus}
                    onReportMinibar={(task) => { setMinibarTask(task); setShowMinibarModal(true); }}
                    onReportIssue={(roomId) => { setReportRoomId(roomId); setShowIssueModal(true); }}
                    locale={locale}
                    readOnly={readOnly}
                    actionLoading={actionLoading}
                />
            )}
            {showIssueModal && (
                <ReportIssueModal
                    defaultRoomId={reportRoomId || ''}
                    onSubmit={handleReportIssue}
                    onClose={() => { setShowIssueModal(false); setReportRoomId(null); }}
                    loading={actionLoading}
                />
            )}
            {showHistoryModal && (
                <RoomHistoryModal onClose={() => setShowHistoryModal(false)} />
            )}
            {showMinibarModal && minibarTask && (
                <MinibarReportMiniModal
                    task={minibarTask}
                    onSubmit={handleReportMinibar}
                    onClose={() => { setShowMinibarModal(false); setMinibarTask(null); }}
                    loading={actionLoading}
                />
            )}
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Quản lý Tác vụ Buồng phòng</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Tổng cộng <span className="font-bold text-[#bfa15f]">{totalElements}</span> tác vụ</p>
                </div>
                {(hasPermission('HOUSEKEEPING_VIEW') || hasPermission('HOUSEKEEPING_UPDATE') || (hasPermission('HOUSEKEEPING_CREATE') && !readOnly)) && (
                    <div className="flex flex-wrap gap-2">
                        {hasPermission('HOUSEKEEPING_VIEW') && (
                            <button onClick={() => setShowHistoryModal(true)}
                                className="flex items-center gap-2 px-3.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-[#bfa15f] hover:text-[#bfa15f] transition-colors bg-white">
                                <History size={16} /> Lịch sử phòng
                            </button>
                        )}
                        {hasPermission('HOUSEKEEPING_UPDATE') && (
                            <button onClick={() => setShowIssueModal(true)}
                                className="flex items-center gap-2 px-3.5 py-2 border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors bg-white">
                                <Wrench size={16} /> Báo cáo sự cố
                            </button>
                        )}
                        {(hasPermission('HOUSEKEEPING_CREATE') && !readOnly) && (
                            <button onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#bfa15f] text-white rounded-lg text-sm font-semibold hover:bg-[#a8893f] transition-colors shadow-sm">
                                <Plus size={16} /> Tạo tác vụ
                            </button>
                        )}
                    </div>
                )}
            </div>
            {/* ── Stats Summary ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(({ status, count }) => {
                    const cfg = STATUS_CONFIG[status];
                    return (
                        <button
                            key={status}
                            onClick={() => handleFilterChange('status', filters.status === status ? '' : status)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${filters.status === status
                                ? `${cfg.color} shadow-sm`
                                : 'bg-white border-stone-200 hover:border-stone-300'
                                }`}
                        >
                            <span className={`w-3 h-3 rounded-full shrink-0 ${cfg.dot}`} />
                            <div>
                                <p className="text-xl font-black text-slate-800">{count}</p>
                                <p className="text-xs text-slate-500 font-medium leading-tight">{cfg.label}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
            {/* ── Filters ─────────────────────────────────────────────────────────── */}
            {!readOnly && (
                <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Trạng thái</label>
                            <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f]">
                                <option value="">Tất cả</option>
                                {TASK_STATUSES.map(s => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[130px]">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">ID Nhân viên</label>
                            <input type="number" value={filters.assignedToId} onChange={e => handleFilterChange('assignedToId', e.target.value)}
                                placeholder="ID nhân viên..." className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f]" />
                        </div>
                        <div className="flex-1 min-w-[130px]">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">ID Người giao</label>
                            <input type="number" value={filters.assignedById} onChange={e => handleFilterChange('assignedById', e.target.value)}
                                placeholder="ID người giao..." className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f]" />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">ID Phòng</label>
                            <input type="number" value={filters.roomId} onChange={e => handleFilterChange('roomId', e.target.value)}
                                placeholder="ID phòng..." className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f]" />
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors">
                                <Search size={15} /> Lọc
                            </button>
                            <button type="button" onClick={handleResetFilters} className="px-3 py-2 border border-stone-200 rounded-lg text-sm text-slate-500 hover:bg-stone-50 transition-colors">
                                <X size={15} />
                            </button>
                            <button type="button" onClick={fetchTasks} className="px-3 py-2 border border-stone-200 rounded-lg text-slate-500 hover:bg-stone-50 transition-colors">
                                <RefreshCw size={15} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* ── View Toggle + Sort ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                        <LayoutGrid size={15} /> Kanban
                    </button>
                    <button onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'table' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                        <TableIcon size={15} /> Bảng
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 font-medium">Sắp xếp:</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#bfa15f]">
                        {SORT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <button onClick={() => setDirection(d => d === 'ASC' ? 'DESC' : 'ASC')}
                        className="p-1.5 border border-stone-200 rounded-lg hover:border-[#bfa15f] transition-colors text-slate-500">
                        {direction === 'ASC' ? <SortAsc size={15} /> : <SortDesc size={15} />}
                    </button>
                    <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                        className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#bfa15f]">
                        {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / trang</option>)}
                    </select>
                </div>
            </div>
            {/* ── Kanban View ──────────────────────────────────────────────────────── */}
            {viewMode === 'kanban' && (
                loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {TASK_STATUSES.map(s => (
                            <div key={s} className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3 animate-pulse">
                                <div className="h-4 bg-stone-200 rounded w-1/2" />
                                {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-stone-200 rounded-xl" />)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {TASK_STATUSES.map(s => (
                            <KanbanColumn key={s} status={s} tasks={kanbanGroups[s]} locale={locale}
                                onView={openDetail} onEdit={openEdit} onDelete={openDelete} readOnly={readOnly} />
                        ))}
                    </div>
                )
            )}
            {/* ── Table View ───────────────────────────────────────────────────────── */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    {['ID', 'Phòng', 'Nhân viên', 'Người giao', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map((h, i) => (
                                        <th key={i} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {loading ? (
                                    [...Array(pageSize > 5 ? 5 : pageSize)].map((_, i) => <SkeletonRow key={i} />)
                                ) : tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16 text-slate-400">
                                            <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
                                            <p>Không có tác vụ nào</p>
                                        </td>
                                    </tr>
                                ) : tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-sm font-bold text-[#bfa15f]">#{task.id}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <BedDouble size={15} className="text-[#bfa15f] shrink-0" />
                                                <span className="text-sm font-semibold text-slate-800">{task.roomNumber || `ID: ${task.roomId}`}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            <div className="font-semibold text-slate-700">{task.assignedToName || `#${task.assignedToId}`}</div>
                                            <div className="mt-1"><WorkStatusBadge status={task.assignedToWorkStatus} /></div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">{task.assignedByName || `#${task.assignedById}`}</td>
                                        <td className="px-4 py-3"><StatusBadge status={task.status} locale={locale} /></td>
                                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                                            {task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openDetail(task)}
                                                    className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors text-slate-400 hover:text-[#bfa15f]" title="Xem chi tiết">
                                                    <Eye size={15} />
                                                </button>
                                                {!readOnly && (
                                                    <>
                                                        <button onClick={() => openEdit(task)}
                                                            className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors text-slate-400 hover:text-amber-600" title="Chỉnh sửa">
                                                            <Pencil size={15} />
                                                        </button>
                                                        <button onClick={() => openDelete(task)}
                                                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600" title="Xóa">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50">
                            <p className="text-xs text-slate-500">
                                Trang <span className="font-bold">{page + 1}</span> / {totalPages} · {totalElements} tác vụ
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(0)} disabled={page === 0}
                                    className="px-2 py-1 text-xs rounded border border-stone-200 disabled:opacity-40 hover:border-[#bfa15f] transition-colors">
                                    «
                                </button>
                                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                    className="px-2 py-1 text-xs rounded border border-stone-200 disabled:opacity-40 hover:border-[#bfa15f] transition-colors flex items-center gap-1">
                                    <ChevronLeft size={13} />
                                </button>
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                                    return (
                                        <button key={pageNum} onClick={() => setPage(pageNum)}
                                            className={`w-7 h-7 text-xs rounded border transition-colors ${page === pageNum ? 'bg-[#bfa15f] text-white border-[#bfa15f]' : 'border-stone-200 hover:border-[#bfa15f] text-slate-600'}`}>
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                    className="px-2 py-1 text-xs rounded border border-stone-200 disabled:opacity-40 hover:border-[#bfa15f] transition-colors flex items-center gap-1">
                                    <ChevronRight size={13} />
                                </button>
                                <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
                                    className="px-2 py-1 text-xs rounded border border-stone-200 disabled:opacity-40 hover:border-[#bfa15f] transition-colors">
                                    »
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

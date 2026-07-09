import React, { useState, useEffect, useCallback } from 'react';
import {
    RefreshCw, Sparkles, CheckCircle2, Wind, BedDouble,
    ArrowRight, LayoutGrid, Table, Filter, AlertTriangle,
    ChevronDown, Wrench, Plus, History, Search, X, Loader2,
    Clock, XCircle, Check, Minus, FileText,
} from 'lucide-react';
import { getDirtyRooms, getCleaningRooms, updateRoomCleaningStatus, housekeepingService } from '../services/housekeepingService';
import { getUsers } from '../services/userService';
import { usePermission } from '../hooks/usePermission';
import { useAuth } from '../context/AuthContext';
import Toast from './shared/Toast';
import Modal from './shared/Modal';

// ─── Task Create Modal ───
function TaskFormModal({ housekeepers, onSubmit, onClose, loading }) {
    const [form, setForm] = useState({ roomId: '', assignedToId: '', notes: '' });
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
                        <Plus size={18} className="text-[#bfa15f]" /> Tạo tác vụ mới
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Số phòng (ID) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number" name="roomId" value={form.roomId} onChange={handleChange}
                            placeholder="Nhập ID phòng..."
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:border-[#bfa15f] ${errors.roomId ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                        />
                        {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            Nhân viên thực hiện <span className="text-red-500">*</span>
                        </label>
                        {housekeepers.length > 0 ? (
                            <select
                                name="assignedToId" value={form.assignedToId} onChange={handleChange}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:border-[#bfa15f] ${errors.assignedToId ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                            >
                                <option value="">Chọn nhân viên...</option>
                                {housekeepers.map(h => (
                                    <option key={h.id} value={h.id} disabled={h.workStatus === 'OFF'}>
                                        {h.fullName} (#{h.id}){h.workStatus === 'OFF' ? ' — Nghỉ' : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="number" name="assignedToId" value={form.assignedToId} onChange={handleChange}
                                placeholder="Nhập ID nhân viên..."
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors focus:border-[#bfa15f] ${errors.assignedToId ? 'border-red-400 bg-red-50' : 'border-stone-200'}`}
                            />
                        )}
                        {errors.assignedToId && <p className="text-red-500 text-xs mt-1">{errors.assignedToId}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ghi chú</label>
                        <textarea
                            name="notes" value={form.notes} onChange={handleChange}
                            rows={3} placeholder="Ghi chú thêm về tác vụ..."
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-[#bfa15f] resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-stone-50 transition-colors">
                            Hủy
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-[#bfa15f] text-white rounded-xl text-sm font-semibold hover:bg-[#a8893f] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Tạo tác vụ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Report Issue Modal ───
function ReportIssueModal({ onSubmit, onClose, loading }) {
    const [form, setForm] = useState({ roomId: '', issueDescription: '', severity: 'MEDIUM' });
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
}

// ─── Room History Modal ───
function RoomHistoryModal({ onClose }) {
    const [roomId, setRoomId] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const STATUS_LABELS = {
        DIRTY: { label: 'Cần dọn', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
        CLEANING: { label: 'Đang dọn', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
        READY: { label: 'Sẵn sàng', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        AVAILABLE: { label: 'Khả dụng', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
        OCCUPIED: { label: 'Đang có khách', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
        MAINTENANCE: { label: 'Bảo trì', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
        CHECKOUT_PENDING: { label: 'Chờ trả phòng', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    };

    const fetchHistory = async (e) => {
        e?.preventDefault();
        if (!roomId) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await housekeepingService.getRoomStateHistory(roomId, { page: 0, size: 30, sortBy: 'ID', direction: 'DESC' });
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
                            {history.map((item, idx) => {
                                const statusKey = item.currentState || item.newStatus || item.status || '';
                                const cfg = STATUS_LABELS[statusKey] || { label: statusKey, color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
                                return (
                                    <div key={item.id || idx} className="relative mb-5 last:mb-0">
                                        <div className="absolute -left-3.5 top-1.5 w-3 h-3 rounded-full bg-[#bfa15f] border-2 border-white shadow" />
                                        <div className="bg-stone-50 rounded-xl p-4 ml-2">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {item.changedAt ? new Date(item.changedAt).toLocaleString('vi-VN') : '—'}
                                                </span>
                                            </div>
                                            {item.previousState && (
                                                <p className="text-xs text-slate-400 mt-1.5">
                                                    Trước đó: <span className="font-medium">{STATUS_LABELS[item.previousState]?.label || item.previousState}</span>
                                                </p>
                                            )}
                                            {(item.triggeredByUserName || item.changedByName) && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Bởi: <span className="font-semibold">{item.triggeredByUserName || item.changedByName}</span>
                                                </p>
                                            )}
                                            {item.reason && <p className="text-xs text-slate-600 mt-1 italic">"{item.reason}"</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

const STATUS_CONFIG = {
    DIRTY: {
        label: 'Cần dọn',
        labelEn: 'Dirty',
        color: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
        headerBg: 'bg-red-50 border-red-100',
        headerText: 'text-red-700',
        Icon: Wind,
    },
    CLEANING: {
        label: 'Đang dọn',
        labelEn: 'In Progress',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        headerBg: 'bg-amber-50 border-amber-100',
        headerText: 'text-amber-700',
        Icon: Sparkles,
    },
    READY: {
        label: 'Sẵn sàng',
        labelEn: 'Ready',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        headerBg: 'bg-emerald-50 border-emerald-100',
        headerText: 'text-emerald-700',
        Icon: CheckCircle2,
    },
};

// ─── Kanban Room Card ───
function KanbanCard({ room, onAction, updating, onReportMaintenance, canUpdate, canReport }) {
    const { roomNumber, floorNumber, roomType, roomStatus } = room;
    const cfg = STATUS_CONFIG[roomStatus] || STATUS_CONFIG.DIRTY;
    const StatusIcon = cfg.Icon;

    const actions = {
        DIRTY: { label: 'Bắt đầu dọn', nextStatus: 'CLEANING', btnClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
        CLEANING: { label: 'Hoàn thành', nextStatus: 'READY', btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
    };
    const nextAction = actions[roomStatus];

    return (
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 group">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-lg bg-[#0c192c] flex items-center justify-center shrink-0 shadow-sm">
                        <BedDouble size={18} className="text-[#bfa15f]" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-base">Phòng {roomNumber}</p>
                        <p className="text-xs text-slate-400">Tầng {floorNumber} · {roomType?.typeName || 'N/A'}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
        </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-auto">
                {nextAction && canUpdate && (
                    <button
                        onClick={() => onAction(room.id, nextAction.nextStatus)}
                        disabled={updating === room.id}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${nextAction.btnClass} disabled:opacity-60 active:scale-[0.98]`}
                    >
                        <StatusIcon size={15} />
                        {updating === room.id ? 'Đang cập nhật...' : nextAction.label}
                        <ArrowRight size={14} />
                    </button>
                )}

                {roomStatus === 'READY' && (
                    <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 rounded-lg text-sm font-semibold text-emerald-600">
                        <CheckCircle2 size={15} />
                        Chờ lễ tân xác nhận
                    </div>
                )}

                {/* Report maintenance button */}
                {roomStatus !== 'READY' && canReport && (
                    <button
                        onClick={() => onReportMaintenance(room)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-slate-500 border border-stone-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Wrench size={13} />
                        Báo cáo bảo trì
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Kanban Column ───
function KanbanColumn({ title, rooms, icon: Icon, config, onAction, updating, onReportMaintenance, canUpdate, canReport }) {
    return (
        <div className="flex-1 min-w-[280px]">
            {/* Column header */}
            <div className={`flex items-center gap-2 px-4 py-3 rounded-t-xl border ${config.headerBg}`}>
                <Icon size={16} className={config.headerText} />
                <span className={`text-sm font-bold ${config.headerText}`}>{title}</span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${config.color}`}>
          {rooms.length}
        </span>
            </div>

            {/* Column body */}
            <div className="bg-stone-50/50 border border-t-0 border-stone-200 rounded-b-xl p-3 min-h-[200px] space-y-3">
                {rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                        <CheckCircle2 size={32} className="mb-2" />
                        <p className="text-xs font-semibold">Không có phòng</p>
                    </div>
                ) : (
                    rooms.map(room => (
                        <KanbanCard
                            key={room.id}
                            room={room}
                            onAction={onAction}
                            updating={updating}
                            onReportMaintenance={onReportMaintenance}
                            canUpdate={canUpdate}
                            canReport={canReport}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Table View ───
function TableView({ rooms, onAction, updating, canUpdate }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                <tr className="border-b-2 border-stone-200">
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-400 font-semibold">Phòng</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-400 font-semibold">Tầng</th>
                    <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-400 font-semibold">Loại phòng</th>
                    <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-slate-400 font-semibold">Trạng thái</th>
                    {canUpdate && <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-slate-400 font-semibold">Thao tác</th>}
                </tr>
                </thead>
                <tbody>
                {rooms.map(room => {
                    const cfg = STATUS_CONFIG[room.roomStatus] || STATUS_CONFIG.DIRTY;
                    const StatusIcon = cfg.Icon;
                    const actions = {
                        DIRTY: { label: 'Bắt đầu dọn', nextStatus: 'CLEANING', btnClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
                        CLEANING: { label: 'Hoàn thành', nextStatus: 'READY', btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
                    };
                    const nextAction = actions[room.roomStatus];

                    return (
                        <tr key={room.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#0c192c] flex items-center justify-center shrink-0">
                                        <BedDouble size={14} className="text-[#bfa15f]" />
                                    </div>
                                    {room.roomNumber}
                                </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{room.floorNumber}</td>
                            <td className="py-3 px-4 text-slate-600">{room.roomType?.typeName || 'N/A'}</td>
                            <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                    <StatusIcon size={12} />
                      {cfg.label}
                  </span>
                            </td>
                            {canUpdate && (
                                <td className="py-3 px-4 text-right">
                                    {nextAction && (
                                        <button
                                            onClick={() => onAction(room.id, nextAction.nextStatus)}
                                            disabled={updating === room.id}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${nextAction.btnClass} disabled:opacity-60`}
                                        >
                                            {updating === room.id ? '...' : nextAction.label}
                                        </button>
                                    )}
                                    {room.roomStatus === 'READY' && (
                                        <span className="text-xs text-emerald-600 font-semibold">✓ Sẵn sàng</span>
                                    )}
                                </td>
                            )}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Housekeeping Board ───
export default function HousekeepingBoard() {
    const { hasPermission } = usePermission();
    const { user } = useAuth();
    const canUpdate = hasPermission('HOUSEKEEPING_UPDATE');
    const canReport = hasPermission('MAINTENANCE_CREATE');
    const canCreate = hasPermission('HOUSEKEEPING_CREATE');
    const canViewHistory = hasPermission('HOUSEKEEPING_VIEW');

    const [dirtyRooms, setDirtyRooms] = useState([]);
    const [cleaningRooms, setCleaningRooms] = useState([]);
    const [readyRooms, setReadyRooms] = useState([]);
    const [housekeepers, setHousekeepers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [updating, setUpdating] = useState(null);
    const [toast, setToast] = useState({ type: 'success', message: '' });
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
    const [filter, setFilter] = useState('all'); // 'all' | 'priority'
    const [filterOpen, setFilterOpen] = useState(false);

    // Action modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Maintenance report modal state
    const [maintenanceModal, setMaintenanceModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [maintenanceNote, setMaintenanceNote] = useState('');

    const notify = (message, type = 'success') => setToast({ type, message });
    const closeToast = () => setToast(t => ({ ...t, message: '' }));

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dirtyRes, cleaningRes] = await Promise.all([
                getDirtyRooms({ page: 0, size: 100 }),
                getCleaningRooms({ page: 0, size: 100 }),
            ]);
            setDirtyRooms(dirtyRes?.data?.content ?? []);
            setCleaningRooms(cleaningRes?.data?.content ?? []);
            // Ready rooms are rooms that transitioned — we track them locally
            // Or if API supports it, fetch ready rooms
        } catch (e) {
            notify(e.message || 'Lỗi tải dữ liệu', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHousekeepers = useCallback(async () => {
        try {
            const res = await getUsers({ role: 'HOUSEKEEPER', page: 0, size: 100 });
            setHousekeepers(res?.data?.content || []);
        } catch {
            setHousekeepers([]);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        fetchHousekeepers();
    }, [fetchAll, fetchHousekeepers]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCreateTask = async (payload) => {
        setActionLoading(true);
        try {
            await housekeepingService.createTask({
                ...payload,
                assignedById: user?.id,
            });
            notify('Tạo tác vụ thành công!');
            setShowCreateModal(false);
            fetchAll();
        } catch (err) {
            notify(err?.message || 'Tạo tác vụ thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReportIssue = async (roomId, payload) => {
        setActionLoading(true);
        try {
            await housekeepingService.reportRoomIssue(roomId, {
                ...payload,
                reportedById: user?.id,
            });
            notify('Đã gửi báo cáo sự cố!');
            setShowIssueModal(false);
        } catch (err) {
            notify(err?.message || 'Gửi báo cáo thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (roomId, nextStatus) => {
        setUpdating(roomId);
        try {
            await updateRoomCleaningStatus(roomId, nextStatus);
            const statusLabels = { CLEANING: 'Đang dọn', READY: 'Đã hoàn thành' };
            notify(`Cập nhật phòng thành "${statusLabels[nextStatus] || nextStatus}" thành công!`);

            // Move room between columns locally for instant feedback
            if (nextStatus === 'CLEANING') {
                const room = dirtyRooms.find(r => r.id === roomId);
                if (room) {
                    setDirtyRooms(prev => prev.filter(r => r.id !== roomId));
                    setCleaningRooms(prev => [...prev, { ...room, roomStatus: 'CLEANING' }]);
                }
            } else if (nextStatus === 'READY') {
                const room = cleaningRooms.find(r => r.id === roomId);
                if (room) {
                    setCleaningRooms(prev => prev.filter(r => r.id !== roomId));
                    setReadyRooms(prev => [...prev, { ...room, roomStatus: 'READY' }]);
                }
            }

            // Also refresh from server
            setTimeout(fetchAll, 1000);
        } catch (e) {
            notify(e.message || 'Lỗi cập nhật trạng thái', 'error');
        } finally {
            setUpdating(null);
        }
    };

    const handleReportMaintenance = (room) => {
        setSelectedRoom(room);
        setMaintenanceNote('');
        setMaintenanceModal(true);
    };

    const submitMaintenanceReport = () => {
        // In a real app, this would call an API
        notify(`Đã báo cáo bảo trì cho phòng ${selectedRoom?.roomNumber}`);
        setMaintenanceModal(false);
        setSelectedRoom(null);
    };

    const allRooms = [...dirtyRooms, ...cleaningRooms, ...readyRooms];
    const total = allRooms.length;

    return (
        <div className="space-y-5">
            <Toast type={toast.type} message={toast.message} onClose={closeToast} />

            {/* ─── Action Modals ─── */}
            {showCreateModal && (
                <TaskFormModal
                    housekeepers={housekeepers}
                    onSubmit={handleCreateTask}
                    onClose={() => setShowCreateModal(false)}
                    loading={actionLoading}
                />
            )}
            {showIssueModal && (
                <ReportIssueModal
                    onSubmit={handleReportIssue}
                    onClose={() => setShowIssueModal(false)}
                    loading={actionLoading}
                />
            )}
            {showHistoryModal && (
                <RoomHistoryModal onClose={() => setShowHistoryModal(false)} />
            )}
            {/* ─── Header: Title + Action Buttons ─── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Quản lý Buồng phòng</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Tổng cộng <span className="font-bold text-[#bfa15f]">{total}</span> phòng đang theo dõi</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {canViewHistory && (
                        <button
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center gap-2 px-3.5 py-2 border border-stone-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-[#bfa15f] hover:text-[#bfa15f] transition-colors bg-white"
                        >
                            <History size={16} /> Lịch sử phòng
                        </button>
                    )}
                    {canUpdate && (
                        <button
                            onClick={() => setShowIssueModal(true)}
                            className="flex items-center gap-2 px-3.5 py-2 border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors bg-white"
                        >
                            <Wrench size={16} /> Báo cáo sự cố
                        </button>
                    )}
                    {canCreate && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#bfa15f] text-white rounded-lg text-sm font-semibold hover:bg-[#a8893f] transition-colors shadow-sm"
                        >
                            <Plus size={16} /> Tạo tác vụ
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center transition-all hover:shadow-md">
                    <Wind size={20} className="text-red-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-red-600">{dirtyRooms.length}</p>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-0.5">Cần dọn</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center transition-all hover:shadow-md">
                    <Sparkles size={20} className="text-amber-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-600">{cleaningRooms.length}</p>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">Đang dọn</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center transition-all hover:shadow-md">
                    <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-600">{readyRooms.length}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Sẵn sàng</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center transition-all hover:shadow-md">
                    <BedDouble size={20} className="text-slate-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-slate-600">{total}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Tổng cộng</p>
                </div>
            </div>

            {/* ─── Toolbar ─── */}
            <div className="flex flex-wrap items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3">
                {/* View toggle */}
                <div className="flex bg-stone-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            viewMode === 'kanban' ? 'bg-white text-[#bfa15f] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <LayoutGrid size={14} />
                        Kanban
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            viewMode === 'table' ? 'bg-white text-[#bfa15f] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Table size={14} />
                        Bảng
                    </button>
                </div>

                {/* Filter */}
                <div className="relative">
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            filter !== 'all'
                                ? 'border-[#bfa15f] text-[#bfa15f] bg-[#faf6ed]'
                                : 'border-stone-200 text-slate-500 hover:border-stone-300'
                        }`}
                    >
                        <Filter size={13} />
                        {filter === 'all' ? 'Tất cả' : 'Ưu tiên'}
                        <ChevronDown size={12} />
                    </button>
                    {filterOpen && (
                        <div className="absolute left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-20 min-w-[140px] text-xs py-1">
                            <button
                                onClick={() => { setFilter('all'); setFilterOpen(false); }}
                                className={`w-full text-left px-3 py-2 hover:bg-stone-50 ${filter === 'all' ? 'text-[#bfa15f] font-bold' : 'text-slate-600'}`}
                            >
                                Tất cả phòng
                            </button>
                            <button
                                onClick={() => { setFilter('priority'); setFilterOpen(false); }}
                                className={`w-full text-left px-3 py-2 hover:bg-stone-50 ${filter === 'priority' ? 'text-[#bfa15f] font-bold' : 'text-slate-600'}`}
                            >
                                Ưu tiên (Check-out)
                            </button>
                        </div>
                    )}
                </div>

                {/* Refresh */}
                <button
                    onClick={fetchAll}
                    disabled={loading}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-60"
                    title="Làm mới danh sách"
                >
                    <RefreshCw size={13} className={loading ? 'animate-spin text-[#bfa15f]' : ''} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>

            </div>

            {/* ─── Content: Kanban or Table ─── */}
            {loading && allRooms.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={24} className="animate-spin text-[#bfa15f]" />
                    <span className="ml-3 text-sm text-slate-500">Đang tải danh sách phòng...</span>
                </div>
            ) : viewMode === 'kanban' ? (
                <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-2">
                    <KanbanColumn
                        title="Cần dọn (DIRTY)"
                        rooms={dirtyRooms}
                        icon={Wind}
                        config={STATUS_CONFIG.DIRTY}
                        onAction={handleAction}
                        updating={updating}
                        onReportMaintenance={handleReportMaintenance}
                        canUpdate={canUpdate}
                        canReport={canReport}
                    />
                    <KanbanColumn
                        title="Đang dọn (CLEANING)"
                        rooms={cleaningRooms}
                        icon={Sparkles}
                        config={STATUS_CONFIG.CLEANING}
                        onAction={handleAction}
                        updating={updating}
                        onReportMaintenance={handleReportMaintenance}
                        canUpdate={canUpdate}
                        canReport={canReport}
                    />
                    <KanbanColumn
                        title="Sẵn sàng (READY)"
                        rooms={readyRooms}
                        icon={CheckCircle2}
                        config={STATUS_CONFIG.READY}
                        onAction={handleAction}
                        updating={updating}
                        onReportMaintenance={handleReportMaintenance}
                        canUpdate={canUpdate}
                        canReport={canReport}
                    />
                </div>
            ) : (
                <TableView rooms={allRooms} onAction={handleAction} updating={updating} canUpdate={canUpdate} />
            )}

            {/* ─── Priority Notice ─── */}
            {dirtyRooms.length > 0 && (
                <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>
            <strong>{dirtyRooms.length} phòng</strong> đang chờ dọn dẹp.
            Ưu tiên dọn phòng có khách check-in sớm nhất trước.
          </span>
                </div>
            )}

            {/* ─── Maintenance Report Modal ─── */}
            <Modal
                open={maintenanceModal}
                title={`Báo cáo bảo trì — Phòng ${selectedRoom?.roomNumber || ''}`}
                onClose={() => setMaintenanceModal(false)}
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
                            Mô tả vấn đề
                        </label>
                        <textarea
                            value={maintenanceNote}
                            onChange={(e) => setMaintenanceNote(e.target.value)}
                            placeholder="VD: Điều hòa không hoạt động, bóng đèn cháy..."
                            rows={4}
                            className="w-full border border-stone-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#bfa15f] transition-colors resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setMaintenanceModal(false)}
                            className="flex-1 py-2.5 border border-stone-300 rounded-lg text-sm font-semibold text-slate-600 hover:border-slate-400 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={submitMaintenanceReport}
                            disabled={!maintenanceNote.trim()}
                            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            <Wrench size={14} />
                            Gửi báo cáo
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

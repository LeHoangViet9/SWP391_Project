import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2, Clock, Loader2, XCircle, RefreshCw,
    BedDouble, ChevronDown, ChevronUp,
    Wrench, Check, X, Loader, Minus, Plus, FileText
} from 'lucide-react';
import Toast from './shared/Toast';
import { housekeepingService } from '../services/housekeepingService';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    PENDING: {
        label: 'Chờ xử lý', labelEn: 'Pending',
        bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
        badge: 'bg-red-100 text-red-700', dot: 'bg-red-500',
        icon: Clock,
        nextStatus: 'IN_PROGRESS', nextLabel: 'Bắt đầu làm', nextLabelEn: 'Start',
        nextBtnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    IN_PROGRESS: {
        label: 'Đang làm', labelEn: 'In Progress',
        bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500',
        icon: Loader2,
        nextStatus: 'COMPLETED', nextLabel: 'Hoàn thành', nextLabelEn: 'Complete',
        nextBtnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    COMPLETED: {
        label: 'Hoàn thành', labelEn: 'Completed',
        bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500',
        icon: CheckCircle2,
        nextStatus: null,
    },
    CANCELLED: {
        label: 'Đã hủy', labelEn: 'Cancelled',
        bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400',
        icon: XCircle,
        nextStatus: null,
    },
};

// ─── Report Issue Mini-Modal (inline) ────────────────────────────────────────
function ReportIssueMiniModal({ roomId, onSubmit, onClose, loading }) {
    const [form, setForm] = useState({ issueDescription: '', severity: 'MEDIUM' });
    const [err, setErr] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.issueDescription.trim()) { setErr('Vui lòng mô tả sự cố'); return; }
        onSubmit(roomId, { issueDescription: form.issueDescription, severity: form.severity });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Wrench size={18} className="text-red-500" /> Báo cáo sự cố
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100 text-slate-400"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Mức độ</label>
                        <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:border-[#bfa15f]">
                            <option value="LOW">🟢 Thấp</option>
                            <option value="MEDIUM">🟡 Trung bình</option>
                            <option value="HIGH">🟠 Cao</option>
                            <option value="CRITICAL">🔴 Khẩn cấp</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Mô tả sự cố *</label>
                        <textarea value={form.issueDescription} onChange={e => { setForm(p => ({ ...p, issueDescription: e.target.value })); setErr(''); }}
                            rows={3} placeholder="Ví dụ: Điều hòa hỏng, tắc bồn tắm..."
                            className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none resize-none focus:border-[#bfa15f] ${err ? 'border-red-400 bg-red-50' : 'border-stone-200'}`} />
                        {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-bold text-slate-600">Hủy</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <Loader size={16} className="animate-spin" /> : <Wrench size={16} />} Gửi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Minibar Report Mini-Modal (inline) ────────────────────────────────────────
function MinibarReportMiniModal({ task, onSubmit, onClose, loading }) {
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
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
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-bold text-slate-600">Hủy</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-3 bg-[#bfa15f] hover:bg-[#a3874c] text-white rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Gửi báo cáo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Task Card Skeleton ──────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-stone-200" />
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-stone-200 rounded w-1/2" />
                    <div className="h-3 bg-stone-200 rounded w-1/3" />
                </div>
            </div>
            <div className="h-12 bg-stone-200 rounded-xl" />
        </div>
    );
}

// ─── Single Task Card ─────────────────────────────────────────────────────────
function TaskCard({ task, onUpdateStatus, updating, onReportIssue, onReportMinibar, locale }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;

    return (
        <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden shadow-sm transition-all`}>
            {/* Card Header – always visible */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.badge}`}>
                            <BedDouble size={22} />
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-lg leading-tight">
                                Phòng {task.roomNumber || task.roomId}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                Tác vụ #{task.id}
                            </p>
                        </div>
                    </div>
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge} ${cfg.border} shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {locale === 'en' ? cfg.labelEn : cfg.label}
                    </span>
                </div>

                {/* Quick action button */}
                {cfg.nextStatus && (
                    <button
                        onClick={() => onUpdateStatus(task.id, cfg.nextStatus)}
                        disabled={updating === task.id}
                        className={`w-full mt-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 ${cfg.nextBtnClass}`}
                    >
                        {updating === task.id
                            ? <><Loader size={16} className="animate-spin" /> Đang cập nhật...</>
                            : <><Check size={16} /> {locale === 'en' ? cfg.nextStatus === 'IN_PROGRESS' ? 'Bắt đầu làm' : 'Dọn xong' : locale === 'en' ? cfg.nextLabelEn : cfg.nextLabel}</>
                        }
                    </button>
                )}

                {task.status === 'IN_PROGRESS' && (
                    <button
                        onClick={() => onReportMinibar(task)}
                        className="w-full mt-3 py-2.5 flex items-center justify-center gap-2 bg-[#bfa15f] hover:bg-[#a3874c] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <FileText size={15} /> Kê khai & Báo cáo Minibar
                    </button>
                )}

                {task.status === 'COMPLETED' && (
                    <div className="flex items-center justify-center gap-2 mt-4 py-3 bg-emerald-100 rounded-xl text-emerald-700 font-bold text-sm">
                        <CheckCircle2 size={18} /> Đã hoàn thành!
                    </div>
                )}
            </div>

            {/* Expandable Details */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-black/5 text-xs font-semibold text-slate-500 hover:bg-black/10 transition-colors"
            >
                <span>Chi tiết tác vụ</span>
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {expanded && (
                <div className="px-4 pb-4 pt-3 space-y-3 border-t border-black/5">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-0.5">Người giao</p>
                            <p className="text-sm font-semibold text-slate-700">{task.assignedByName || `#${task.assignedById}` || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-0.5">Ngày tạo</p>
                            <p className="text-sm font-semibold text-slate-700">
                                {task.createdAt ? new Date(task.createdAt).toLocaleDateString('vi-VN') : '—'}
                            </p>
                        </div>
                    </div>
                    {task.notes && (
                        <div className="bg-white/70 rounded-xl p-3 border border-black/5">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">Ghi chú</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{task.notes}</p>
                        </div>
                    )}
                    {/* Report issue button */}
                    <button
                        onClick={() => onReportIssue(task.roomId)}
                        className="w-full py-2.5 flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors"
                    >
                        <Wrench size={14} /> Báo cáo sự cố phòng
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HousekeeperTaskBoard() {
    const { user } = useAuth();
    const { locale } = useLocale();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(null); // id of task being updated
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState({ type: 'success', message: '' });
    const [filterStatus, setFilterStatus] = useState(''); // '' = all uncompleted
    const [reportRoomId, setReportRoomId] = useState(null); // null | roomId
    const [minibarTask, setMinibarTask] = useState(null); // null | task

    const notify = (msg, type = 'success') => setToast({ type, message: msg });

    // Normalize backend field names for robustness
    const normalizeTask = (t) => ({
        ...t,
        status: t.status || t.taskStatus || t.state || '',
        roomId: t.roomId || t.room?.id,
        roomNumber: t.roomNumber || t.room?.roomNumber || t.room?.number,
        assignedToId: t.assignedToId || t.assignedTo?.id,
        assignedToName: t.assignedToName || t.assignedTo?.fullName || t.assignedTo?.name,
        assignedById: t.assignedById || t.assignedBy?.id,
        assignedByName: t.assignedByName || t.assignedBy?.fullName || t.assignedBy?.name,
        notes: t.notes || t.description || t.note || '',
        createdAt: t.createdAt || t.createAt || t.created_at || '',
    });

    // Fetch my tasks
    const fetchMyTasks = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await housekeepingService.getUncompletedByUser(user.id, locale);
            const all = (res?.data || []).map(normalizeTask);
            setTasks(filterStatus ? all.filter(t => t.status === filterStatus) : all);
        } catch (err) {
            notify(err?.message || 'Không thể tải danh sách công việc', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.id, locale, filterStatus]);

    useEffect(() => { fetchMyTasks(); }, [fetchMyTasks]);

    // Update status
    const handleUpdateStatus = async (taskId, newStatus) => {
        setUpdating(taskId);
        try {
            const res = await housekeepingService.updateTask(taskId, { status: newStatus }, locale);
            notify(res?.message || 'Cập nhật trạng thái thành công!');
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
            if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
                setTimeout(() => {
                    setTasks(prev => prev.filter(t => t.id !== taskId));
                }, 1500);
            }
        } catch (err) {
            notify(err?.message || 'Cập nhật thất bại', 'error');
        } finally {
            setUpdating(null);
        }
    };

    // Report room issue
    const handleReportIssue = async (roomId, payload) => {
        setActionLoading(true);
        try {
            const res = await housekeepingService.reportRoomIssue(roomId, payload, locale);
            notify(res?.message || 'Đã gửi báo cáo sự cố!');
            setReportRoomId(null);
        } catch (err) {
            notify(err?.message || 'Gửi báo cáo thất bại', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Report minibar consumption
    const handleReportMinibar = async (taskId, quantities) => {
        setActionLoading(true);
        try {
            const res = await housekeepingService.reportMinibar(taskId, quantities, locale);
            notify(res?.message || 'Đã gửi báo cáo tiêu dùng Minibar thành công!');
            setMinibarTask(null);
        } catch (err) {
            notify(err?.message || 'Không tìm thấy đặt phòng hoặc gửi thất bại.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Local counts for headers
    const counts = useMemo(() => {
        const c = { PENDING: 0, IN_PROGRESS: 0 };
        tasks.forEach(t => {
            if (t.status === 'PENDING') c.PENDING++;
            if (t.status === 'IN_PROGRESS') c.IN_PROGRESS++;
        });
        return { '': tasks.length, ...c };
    }, [tasks]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 pb-safe">
            <Toast type={toast.type} message={toast.message} onClose={() => setToast(p => ({ ...p, message: '' }))} />

            {/* Report Issue Modal */}
            {reportRoomId !== null && (
                <ReportIssueMiniModal
                    roomId={reportRoomId}
                    onSubmit={handleReportIssue}
                    onClose={() => setReportRoomId(null)}
                    loading={actionLoading}
                />
            )}

            {/* Report Minibar Modal */}
            {minibarTask !== null && (
                <MinibarReportMiniModal
                    task={minibarTask}
                    onSubmit={handleReportMinibar}
                    onClose={() => setMinibarTask(null)}
                    loading={actionLoading}
                />
            )}

            {/* Hero Header */}
            <div className="bg-[#0c192c] px-5 pt-8 pb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[#bfa15f] text-xs font-bold uppercase tracking-widest mb-1">HMS Buồng phòng</p>
                        <h1 className="text-white text-2xl font-black leading-tight">
                            Xin chào, {user?.fullName?.split(' ').pop() || 'Nhân viên'} 👋
                        </h1>
                        <p className="text-white/50 text-sm mt-1">
                            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    <button
                        onClick={fetchMyTasks}
                        disabled={loading}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                        <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                        { key: '', label: 'Tổng việc', color: 'bg-white/10 text-white' },
                        { key: 'PENDING', label: 'Chờ làm', color: 'bg-red-500/20 text-red-300' },
                        { key: 'IN_PROGRESS', label: 'Đang làm', color: 'bg-amber-500/20 text-amber-300' },
                    ].map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`rounded-2xl p-3 text-center transition-all border-2 ${filterStatus === key ? 'border-[#bfa15f] scale-105' : 'border-transparent'
                                } ${color}`}
                        >
                            <p className="text-2xl font-black">{loading ? '—' : (counts[key] ?? 0)}</p>
                            <p className="text-xs font-semibold opacity-80 mt-0.5">{label}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List */}
            <div className="px-4 pt-5 space-y-3 max-w-lg mx-auto">
                {loading ? (
                    <>
                        <SkeletonCard /><SkeletonCard /><SkeletonCard />
                    </>
                ) : tasks.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                        <div className="p-8 text-center text-slate-500 font-medium">Không có công việc nào cần xử lý.</div>
                    </div>
                ) : (
                    tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            locale={locale}
                            onUpdateStatus={handleUpdateStatus}
                            updating={updating}
                            onReportIssue={(roomId) => setReportRoomId(roomId)}
                            onReportMinibar={(t) => setMinibarTask(t)}
                        />
                    ))
                )}

                {/* Footer spacer */}
                <div className="h-6" />
            </div>
        </div>
    );
}

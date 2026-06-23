import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, CheckCircle2, Wind, Clock, BedDouble, ArrowRight } from 'lucide-react';
import { getDirtyRooms, getCleaningRooms, updateRoomCleaningStatus } from '../services/housekeepingService';
import Toast from './shared/Toast';

const STATUS_CONFIG = {
  DIRTY: {
    label: 'Cần dọn',
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    Icon: Wind,
  },
  CLEANING: {
    label: 'Đang dọn',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    Icon: Sparkles,
  },
  READY: {
    label: 'Đã sẵn sàng',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    Icon: CheckCircle2,
  },
};

function RoomCard({ room, onAction, updating }) {
  const { roomNumber, floorNumber, roomType, roomStatus } = room;
  const cfg = STATUS_CONFIG[roomStatus] || STATUS_CONFIG.DIRTY;
  const StatusIcon = cfg.Icon;

  const nextAction =
    roomStatus === 'DIRTY'
      ? { label: 'Bắt đầu dọn', nextStatus: 'CLEANING', btnClass: 'bg-amber-500 hover:bg-amber-600 text-white' }
      : roomStatus === 'CLEANING'
      ? { label: 'Hoàn thành', nextStatus: 'READY', btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white' }
      : null;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#0c192c] flex items-center justify-center shrink-0">
            <BedDouble size={18} className="text-[#bfa15f]" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Phòng {roomNumber}</p>
            <p className="text-xs text-slate-400">Tầng {floorNumber} · {roomType?.typeName || 'N/A'}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Footer action */}
      {nextAction && (
        <button
          onClick={() => onAction(room.id, nextAction.nextStatus)}
          disabled={updating === room.id}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${nextAction.btnClass} disabled:opacity-60`}
        >
          <StatusIcon size={15} />
          {updating === room.id ? 'Đang cập nhật...' : nextAction.label}
          <ArrowRight size={14} />
        </button>
      )}
      {roomStatus === 'READY' && (
        <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 rounded-lg text-sm font-semibold text-emerald-600">
          <CheckCircle2 size={15} />
          Phòng đã sạch, chờ lễ tân xác nhận
        </div>
      )}
    </div>
  );
}

export default function CleaningTaskList() {
  const [dirtyRooms, setDirtyRooms] = useState([]);
  const [cleaningRooms, setCleaningRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null); // roomId being updated
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [activeTab, setActiveTab] = useState('dirty'); // 'dirty' | 'cleaning'

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dirtyRes, cleaningRes] = await Promise.all([
        getDirtyRooms({ page: 0, size: 50 }),
        getCleaningRooms({ page: 0, size: 50 }),
      ]);
      setDirtyRooms(dirtyRes?.data?.content ?? []);
      setCleaningRooms(cleaningRes?.data?.content ?? []);
    } catch (e) {
      notify(e.message || 'Lỗi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAction = async (roomId, nextStatus) => {
    setUpdating(roomId);
    try {
      await updateRoomCleaningStatus(roomId, nextStatus);
      const statusLabels = { CLEANING: 'Đang dọn', READY: 'Đã hoàn thành' };
      notify(`Cập nhật phòng thành "${statusLabels[nextStatus] || nextStatus}" thành công!`);
      await fetchAll();
    } catch (e) {
      notify(e.message || 'Lỗi cập nhật trạng thái', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const displayRooms = activeTab === 'dirty' ? dirtyRooms : cleaningRooms;
  const total = dirtyRooms.length + cleaningRooms.length;

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{dirtyRooms.length}</p>
          <p className="text-xs font-semibold text-red-500 mt-1">Cần dọn (DIRTY)</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{cleaningRooms.length}</p>
          <p className="text-xs font-semibold text-amber-500 mt-1">Đang dọn (CLEANING)</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">{total}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Tổng nhiệm vụ</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-4 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('dirty')}
          className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === 'dirty'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wind size={15} />
          Cần dọn
          {dirtyRooms.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {dirtyRooms.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('cleaning')}
          className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === 'cleaning'
              ? 'border-b-2 border-amber-500 text-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={15} />
          Đang dọn
          {cleaningRooms.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {cleaningRooms.length}
            </span>
          )}
        </button>

        {/* Refresh button */}
        <button
          onClick={fetchAll}
          disabled={loading}
          className="ml-auto mb-3 p-2 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          title="Làm mới danh sách"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#bfa15f]' : 'text-slate-500'} />
        </button>
      </div>

      {/* Room cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-[#bfa15f]" />
          <span className="ml-3 text-sm text-slate-500">Đang tải danh sách phòng...</span>
        </div>
      ) : displayRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <CheckCircle2 size={48} className="mb-3 text-emerald-300" />
          <p className="text-base font-semibold">
            {activeTab === 'dirty' ? 'Không có phòng nào cần dọn!' : 'Không có phòng nào đang được dọn!'}
          </p>
          <p className="text-sm mt-1">
            {activeTab === 'dirty' ? 'Tất cả phòng đều sạch sẽ 🎉' : 'Chưa có nhân viên nào bắt đầu dọn phòng'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRooms.map(room => (
            <RoomCard key={room.id} room={room} onAction={handleAction} updating={updating} />
          ))}
        </div>
      )}

      {/* Priority notice */}
      {dirtyRooms.length > 0 && activeTab === 'dirty' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
          <Clock size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>{dirtyRooms.length} phòng</strong> đang chờ dọn dẹp.
            Ưu tiên dọn phòng có khách check-in sớm nhất trước.
          </span>
        </div>
      )}
    </div>
  );
}

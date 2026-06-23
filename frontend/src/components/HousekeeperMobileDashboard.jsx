import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw, Sparkles, CheckCircle2, Wind, Clock, BedDouble,
  ArrowRight, AlertTriangle, Check, X, Wrench, ChevronRight,
  User, CheckSquare, Square, ChevronLeft
} from 'lucide-react';
import { getDirtyRooms, getCleaningRooms, updateRoomCleaningStatus } from '../services/housekeepingService';
import { maintenanceService } from '../services/maintenanceService';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';

// ─── Standard Checklist Tasks ──────────────────────────────────────────────────
const STANDARD_TASKS = [
  { id: 'ga_giuong', label: 'Thay ga giường & vỏ gối', labelEn: 'Change bed sheets & pillowcases' },
  { id: 'wc', label: 'Dọn dẹp & khử trùng toilet/nhà tắm', labelEn: 'Clean & sanitize bathroom' },
  { id: 'hut_bui', label: 'Hút bụi & lau sàn phòng ngủ', labelEn: 'Vacuum & mop bedroom floor' },
  { id: 'minibar', label: 'Kiểm tra & bổ sung nước Minibar', labelEn: 'Check & replenish minibar' },
  { id: 'bui_noi_that', label: 'Lau bụi bàn ghế & bề mặt nội thất', labelEn: 'Dust furniture & surfaces' },
  { id: 'do_rac', label: 'Đổ rác & thay túi rác mới', labelEn: 'Empty trash & replace liners' },
  { id: 'khan_dung_cu', label: 'Bổ sung khăn tắm & đồ tiêu hao mới', labelEn: 'Replenish towels & toiletries' },
  { id: 'thiet_bi_dien', label: 'Kiểm tra tivi, điều hòa & ổ cắm', labelEn: 'Verify TV, AC & electronics' }
];

export default function HousekeeperMobileDashboard({ isSimulator = false, onToggleView }) {
  const { user } = useAuth();
  const { locale, t } = useLocale();

  // ── State: Data ──────────────────────────────────────────────────────────
  const [dirtyRooms, setDirtyRooms] = useState([]);
  const [cleaningRooms, setCleaningRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null); // roomId being updated
  const [toast, setToast] = useState({ type: 'success', message: '' });

  // ── State: Navigation & Filter ───────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'dirty' | 'cleaning'
  const [selectedRoom, setSelectedRoom] = useState(null); // Room details drawer
  const [checklist, setChecklist] = useState({}); // Room checklist state { [roomId]: { [taskId]: boolean } }

  // ── State: Issue Report Modal ────────────────────────────────────────────
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ severity: 'MEDIUM', title: '', desc: '' });
  const [issueSaving, setIssueSaving] = useState(false);

  // ── Notifications ────────────────────────────────────────────────────────
  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(p => ({ ...p, message: '' }));

  // ── Calculate deterministic checkout time & priority ──────────────────────
  const getCheckoutDetails = useCallback((room) => {
    const seed = room.id || 0;
    // Generate hours: 9, 10, 11
    const hour = 9 + (seed % 3);
    const minute = (seed * 17) % 60;
    const minuteStr = minute < 10 ? `0${minute}` : minute;
    const checkoutTime = `${hour}:${minuteStr}`;

    // Priority based on seed (simulating checkouts that happened earlier)
    const hoursAgo = (seed % 3) + 1; // 1, 2, or 3 hours ago
    const minutesAgo = hoursAgo * 60 + ((seed * 7) % 30);
    const timeLabel = minutesAgo >= 60 
      ? `${Math.floor(minutesAgo / 60)} giờ trước` 
      : `${minutesAgo} phút trước`;

    // Priority: DIRTY rooms checked out more than 90 mins ago get HIGH priority
    const priority = minutesAgo > 90 ? 'HIGH' : 'NORMAL';

    return { checkoutTime, timeLabel, priority, minutesAgo };
  }, []);

  // ── Fetch data from backend ──────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const [dirtyRes, cleaningRes] = await Promise.all([
        getDirtyRooms({ page: 0, size: 100 }, locale),
        getCleaningRooms({ page: 0, size: 100 }, locale)
      ]);

      const dirty = (dirtyRes?.data?.content ?? []).map(r => ({
        ...r,
        ...getCheckoutDetails(r)
      }));

      const cleaning = (cleaningRes?.data?.content ?? []).map(r => ({
        ...r,
        ...getCheckoutDetails(r)
      }));

      // Sort dirty rooms by minutesAgo DESC (i.e. those checked out longest ago are at the top)
      dirty.sort((a, b) => b.minutesAgo - a.minutesAgo);

      setDirtyRooms(dirty);
      setCleaningRooms(cleaning);

      // Keep selectedRoom updated if details screen is active
      if (selectedRoom) {
        const updated = [...dirty, ...cleaning].find(r => r.id === selectedRoom.id);
        if (updated) setSelectedRoom(updated);
      }
    } catch (e) {
      notify(e.message || 'Lỗi tải danh sách phòng', 'error');
    } finally {
      setLoading(false);
    }
  }, [locale, getCheckoutDetails, selectedRoom]);

  useEffect(() => {
    fetchRooms();
  }, []);

  // Load checklist states from localStorage for all current cleaning rooms
  useEffect(() => {
    const loadedChecklist = {};
    const allRooms = [...dirtyRooms, ...cleaningRooms];
    allRooms.forEach(room => {
      try {
        const stored = localStorage.getItem(`hms_checklist_room_${room.roomNumber}`);
        if (stored) {
          loadedChecklist[room.id] = JSON.parse(stored);
        } else {
          // Initialize empty
          loadedChecklist[room.id] = STANDARD_TASKS.reduce((acc, t) => {
            acc[t.id] = false;
            return acc;
          }, {});
        }
      } catch (e) {
        console.error(e);
      }
    });
    setChecklist(loadedChecklist);
  }, [dirtyRooms, cleaningRooms]);

  // ── Update single task in checklist ───────────────────────────────────────
  const handleToggleTask = (roomId, roomNumber, taskId) => {
    setChecklist(prev => {
      const roomChecklist = prev[roomId] || {};
      const updated = {
        ...prev,
        [roomId]: {
          ...roomChecklist,
          [taskId]: !roomChecklist[taskId]
        }
      };
      // Persist to localStorage
      try {
        localStorage.setItem(`hms_checklist_room_${roomNumber}`, JSON.stringify(updated[roomId]));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // ── Quick Claim (DIRTY -> CLEANING) ───────────────────────────────────────
  const handleClaimRoom = async (room) => {
    setUpdating(room.id);
    try {
      await updateRoomCleaningStatus(room.id, 'CLEANING', locale);
      notify(`Đã nhận dọn dẹp Phòng ${room.roomNumber}!`, 'success');
      
      // Move room between lists locally for responsive UI
      const updatedRoom = { ...room, roomStatus: 'CLEANING' };
      setDirtyRooms(prev => prev.filter(r => r.id !== room.id));
      setCleaningRooms(prev => [...prev, updatedRoom]);
      
      // Auto open detailed checklist
      setSelectedRoom(updatedRoom);
      fetchRooms();
    } catch (e) {
      notify(e.message || 'Lỗi cập nhật trạng thái', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // ── Start Clean from details (DIRTY -> CLEANING) ──────────────────────────
  const handleStartClean = async (room) => {
    setUpdating(room.id);
    try {
      await updateRoomCleaningStatus(room.id, 'CLEANING', locale);
      notify(`Bắt đầu dọn dẹp Phòng ${room.roomNumber}!`, 'success');
      
      const updatedRoom = { ...room, roomStatus: 'CLEANING' };
      setSelectedRoom(updatedRoom);
      fetchRooms();
    } catch (e) {
      notify(e.message || 'Lỗi cập nhật trạng thái', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // ── Complete Clean (CLEANING -> READY) ────────────────────────────────────
  const handleCompleteClean = async (room) => {
    setUpdating(room.id);
    try {
      await updateRoomCleaningStatus(room.id, 'READY', locale);
      notify(`Phòng ${room.roomNumber} đã dọn xong và sẵn sàng! 🎉`, 'success');
      
      // Clear checklist from localStorage
      try {
        localStorage.removeItem(`hms_checklist_room_${room.roomNumber}`);
      } catch (e) {
        console.error(e);
      }
      
      setSelectedRoom(null); // Close details
      fetchRooms();
    } catch (e) {
      notify(e.message || 'Lỗi hoàn thành dọn phòng', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // ── Submit Issue (Maintenance Request) ────────────────────────────────────
  const handleReportIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.title.trim()) {
      notify('Vui lòng nhập tiêu đề sự cố!', 'warning');
      return;
    }
    setIssueSaving(true);
    try {
      const payload = {
        roomId: selectedRoom.id,
        reportedBy: user?.id,
        issueTitle: `Phòng ${selectedRoom.roomNumber}: ${issueForm.title.trim()}`,
        issueDescription: issueForm.desc.trim() || `Phát hiện lỗi khi dọn dẹp Phòng ${selectedRoom.roomNumber}.`,
        severity: issueForm.severity
      };
      await maintenanceService.create(payload, locale);
      notify(`Đã báo cáo sự cố Phòng ${selectedRoom.roomNumber} thành công!`, 'success');
      setShowIssueModal(false);
      setIssueForm({ severity: 'MEDIUM', title: '', desc: '' });
    } catch (err) {
      notify(err.message || 'Lỗi khi báo cáo sự cố', 'error');
    } finally {
      setIssueSaving(false);
    }
  };

  // ── Tab filter calculation ───────────────────────────────────────────────
  const activeRooms = useMemo(() => {
    if (activeTab === 'dirty') return dirtyRooms;
    if (activeTab === 'cleaning') return cleaningRooms;
    return [...dirtyRooms, ...cleaningRooms];
  }, [activeTab, dirtyRooms, cleaningRooms]);

  // Calculate stats for tab badges
  const stats = useMemo(() => {
    return {
      total: dirtyRooms.length + cleaningRooms.length,
      dirty: dirtyRooms.length,
      cleaning: cleaningRooms.length
    };
  }, [dirtyRooms, cleaningRooms]);

  // Checklist completion percentage calculation
  const getProgress = (roomId) => {
    const roomChecklist = checklist[roomId] || {};
    const total = STANDARD_TASKS.length;
    const checked = Object.values(roomChecklist).filter(Boolean).length;
    return {
      checked,
      total,
      percent: Math.round((checked / total) * 100) || 0,
      isFinished: checked === total
    };
  };

  // ── Inner UI Content ─────────────────────────────────────────────────────
  const mobileContent = (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans relative select-none">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      {/* ── Header Area ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 px-4 pt-5 pb-5 text-white shadow-md relative shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-[#bfa15f] to-[#a88a4a] rounded-full flex items-center justify-center font-bold text-white text-base shadow-inner">
              {user?.fullName?.charAt(0) || 'H'}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#bfa15f] leading-none mb-1">HMS Housekeeper</p>
              <h2 className="text-sm font-extrabold tracking-tight leading-none truncate max-w-[150px]">
                {user?.fullName || 'Nhân Viên Buồng'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSimulator && (
              <button 
                onClick={onToggleView}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition-colors border border-white/20 text-[#bfa15f]"
              >
                Chế độ Bảng
              </button>
            )}
            <button 
              onClick={fetchRooms}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-90"
              title="Làm mới"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#bfa15f]' : 'text-white'} />
            </button>
          </div>
        </div>

        {/* Date and mini status card */}
        <div className="mt-4 flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Ngày làm việc</p>
            <p className="text-xs font-bold mt-0.5 text-white">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-extrabold tracking-wider text-slate-200">
              {stats.dirty} PHÒNG CẦN DỌN
            </span>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex gap-1.5 w-full">
          {[
            { id: 'all', label: 'Tất cả', count: stats.total, activeColor: 'bg-slate-900 text-white' },
            { id: 'dirty', label: 'Cần dọn', count: stats.dirty, activeColor: 'bg-red-500 text-white' },
            { id: 'cleaning', label: 'Đang dọn', count: stats.cleaning, activeColor: 'bg-amber-500 text-white' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 border ${
                activeTab === tab.id 
                  ? `${tab.activeColor} border-transparent shadow-sm` 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white font-black' : 'bg-slate-200 text-slate-600 font-bold'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main List Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
        {loading && activeRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw size={28} className="animate-spin text-[#bfa15f]" />
            <p className="text-xs font-bold">Đang tải danh sách phòng...</p>
          </div>
        ) : activeRooms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm flex flex-col items-center justify-center py-14">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Tuyệt vời!</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-[200px] mx-auto">
              Không có phòng nào trong danh mục này cần xử lý.
            </p>
          </div>
        ) : (
          activeRooms.map(room => {
            const isDirty = room.roomStatus === 'DIRTY';
            const progress = getProgress(room.id);
            
            return (
              <div 
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`bg-white border-2 rounded-2xl shadow-sm overflow-hidden active:scale-[0.99] transition-all duration-150 cursor-pointer flex flex-col ${
                  isDirty 
                    ? room.priority === 'HIGH' 
                      ? 'border-red-200 hover:border-red-300' 
                      : 'border-orange-100 hover:border-orange-200' 
                    : 'border-amber-100 hover:border-amber-200'
                }`}
              >
                {/* Card Top */}
                <div className="p-4 flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                      isDirty 
                        ? room.priority === 'HIGH' 
                          ? 'bg-red-50 text-red-500' 
                          : 'bg-orange-50 text-orange-500'
                        : 'bg-amber-50 text-amber-500'
                    }`}>
                      <BedDouble size={22} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-black text-slate-800 text-xl tracking-tight leading-tight">
                        Phòng {room.roomNumber}
                      </h3>
                      <p className="text-slate-400 text-[10px] font-bold mt-0.5">
                        Tầng {room.floorNumber} · {room.roomType?.typeName || 'Standard'}
                      </p>
                    </div>
                  </div>

                  {/* Badges Column */}
                  <div className="flex flex-col items-end gap-1.5">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase shrink-0 ${
                      isDirty 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-red-500' : 'bg-amber-500'}`} />
                      {isDirty ? 'Chờ dọn' : 'Đang dọn'}
                    </span>

                    {/* Priority Badge (only for Dirty rooms) */}
                    {isDirty && (
                      <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded ${
                        room.priority === 'HIGH' 
                          ? 'bg-red-600 text-white animate-pulse' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {room.priority === 'HIGH' ? '🔴 CẦN DỌN GẤP' : '🟡 DỌN THƯỜNG'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info and Progress */}
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-medium">
                    <Clock size={13} className="text-slate-400" />
                    <span>Checkout: <strong className="text-slate-700">{room.checkoutTime}</strong> ({room.timeLabel})</span>
                  </div>
                  
                  {!isDirty && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-amber-600">{progress.percent}%</span>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="p-3 border-t border-slate-100 bg-white">
                  {isDirty ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimRoom(room);
                      }}
                      disabled={updating === room.id}
                      className="w-full bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      {updating === room.id ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <>
                          <Sparkles size={15} className="text-[#bfa15f]" />
                          Nhận dọn phòng này
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="w-full bg-[#faf6ed] hover:bg-[#f3ead5] text-[#bfa15f] border border-[#bfa15f]/30 font-extrabold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      Chi tiết công việc
                      <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Bottom Slide-up Details Drawer ─── */}
      {selectedRoom && (() => {
        const isDirty = selectedRoom.roomStatus === 'DIRTY';
        const progress = getProgress(selectedRoom.id);
        const roomChecklist = checklist[selectedRoom.id] || {};

        return (
          <>
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 z-30 transition-opacity duration-300 cursor-pointer"
              onClick={() => setSelectedRoom(null)}
            />

            {/* Slide-up Container */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-white rounded-t-[2.5rem] shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* Drag Handle Bar */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0 cursor-pointer" onClick={() => setSelectedRoom(null)} />
              
              {/* Header */}
              <div className="px-5 pb-4 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase text-[#bfa15f] bg-[#faf6ed] px-2 py-0.5 rounded tracking-wider">
                    Dọn dẹp buồng phòng
                  </span>
                  <h2 className="font-black text-slate-800 text-2xl mt-1 tracking-tight leading-none">
                    Phòng {selectedRoom.roomNumber}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1.5 font-bold">
                    Tầng {selectedRoom.floorNumber} · {selectedRoom.roomType?.typeName || 'Room Standard'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Status card */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 text-xs flex justify-between items-center">
                  <div className="text-left space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Trạng thái dọn dẹp</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className="font-extrabold text-slate-800 text-sm">
                        {isDirty ? 'Chưa bắt đầu dọn' : 'Đang tiến hành dọn'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Độ ưu tiên (Checkout)</p>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      selectedRoom.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedRoom.priority === 'HIGH' ? '🔴 Cao' : '🟡 Trung bình'}
                    </span>
                  </div>
                </div>

                {/* Progress Tracker (only if Cleaning) */}
                {!isDirty && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">Tiến độ hoàn thành</span>
                      <span className="font-black text-slate-800 text-sm">{progress.checked}/{progress.total} đầu việc ({progress.percent}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Checklist Section */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                    Các hạng mục tiêu chuẩn
                  </h3>
                  
                  {isDirty && (
                    <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3.5 rounded-xl text-center font-bold">
                      ⚠️ Hãy bấm nút "Bắt đầu dọn" ở dưới để mở khóa checklist công việc!
                    </div>
                  )}

                  <div className="space-y-2">
                    {STANDARD_TASKS.map(task => {
                      const isChecked = roomChecklist[task.id] || false;
                      return (
                        <div 
                          key={task.id}
                          onClick={() => {
                            if (!isDirty) {
                              handleToggleTask(selectedRoom.id, selectedRoom.roomNumber, task.id);
                            }
                          }}
                          className={`flex items-center gap-3.5 p-3.5 border rounded-2xl transition-all duration-150 ${
                            isDirty 
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isChecked 
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-700 active:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="shrink-0">
                            {isDirty ? (
                              <Square size={20} className="text-slate-300" />
                            ) : isChecked ? (
                              <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                <Check size={14} className="stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white" />
                            )}
                          </div>
                          <div className="text-left flex-1">
                            <p className={`text-sm font-bold leading-tight ${isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {locale === 'en' ? task.labelEn : task.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Report Issue button inside drawer */}
                <button
                  onClick={() => setShowIssueModal(true)}
                  className="w-full py-3.5 flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-2xl text-xs font-extrabold hover:bg-red-50/80 active:scale-95 transition-all shadow-sm"
                >
                  <AlertTriangle size={15} /> Báo cáo sự cố phòng này
                </button>
              </div>

              {/* Floating Bottom CTA Actions */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                {isDirty ? (
                  <button
                    onClick={() => handleStartClean(selectedRoom)}
                    disabled={updating === selectedRoom.id}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {updating === selectedRoom.id ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={18} className="text-[#bfa15f]" />
                        Bắt đầu dọn ngay
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCompleteClean(selectedRoom)}
                    disabled={!progress.isFinished || updating === selectedRoom.id}
                    className={`w-full font-extrabold text-base py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all duration-200 border-2 ${
                      progress.isFinished
                        ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {updating === selectedRoom.id ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Hoàn thành & Cập nhật Sẵn sàng
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* ─── nested Báo cáo sự cố Modal ─── */}
      {showIssueModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-left flex flex-col">
            <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Wrench size={16} className="text-[#bfa15f]" /> Báo cáo sự cố Phòng {selectedRoom?.roomNumber}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowIssueModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleReportIssueSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mức độ nghiêm trọng</label>
                <select 
                  value={issueForm.severity} 
                  onChange={e => setIssueForm(p => ({ ...p, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-slate-50 font-bold focus:border-[#bfa15f]"
                >
                  <option value="LOW">🟢 Thấp (Low)</option>
                  <option value="MEDIUM">🟡 Trung bình (Medium)</option>
                  <option value="HIGH">🟠 Cao (High)</option>
                  <option value="CRITICAL">🔴 Khẩn cấp (Critical)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiêu đề sự cố *</label>
                <input 
                  type="text"
                  required
                  value={issueForm.title}
                  onChange={e => setIssueForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ví dụ: Hỏng vòi sen, Bóng đèn cháy..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#bfa15f]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả chi tiết</label>
                <textarea 
                  rows={3}
                  value={issueForm.desc}
                  onChange={e => setIssueForm(p => ({ ...p, desc: e.target.value }))}
                  placeholder="Mô tả cụ thể sự cố để bộ phận bảo trì chuẩn bị dụng cụ sửa chữa..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#bfa15f] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={issueSaving}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {issueSaving ? <RefreshCw size={13} className="animate-spin" /> : <Wrench size={13} />}
                  Gửi sự cố
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render Wrapper: Simulator Frame on Desktop, Full Screen on Mobile ──
  return (
    <>
      {/* 1. Desktop Mode (MD width and above) - Mockup smartphone inside layout */}
      <div className="hidden md:flex flex-col items-center justify-center py-6 bg-slate-900/90 rounded-2xl shadow-inner border border-slate-800">
        <p className="text-[#bfa15f] text-xs font-bold uppercase tracking-widest mb-3 select-none flex items-center gap-1.5">
          <span>📱</span> Trình mô phỏng giao diện điện thoại (Housekeeper Mobile Preview)
        </p>
        
        {/* Device frame container */}
        <div className="relative mx-auto border-slate-950 bg-slate-950 border-[12px] rounded-[3rem] h-[640px] w-[340px] shadow-2xl overflow-hidden ring-4 ring-slate-800 select-none">
          {/* Speaker notch */}
          <div className="h-[20px] w-[120px] bg-slate-950 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-50 flex items-center justify-center">
            <div className="h-[4px] w-[40px] bg-slate-800 rounded-full" />
          </div>
          
          {/* Internal content wrapper */}
          <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-[#f8fafc] flex flex-col">
            {/* Status bar */}
            <div className="h-5 bg-slate-950 text-white text-[9px] px-6 pt-1 flex justify-between items-center select-none shrink-0 font-semibold z-40">
              <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex items-center gap-1 text-[8px]">
                <span>5G</span>
                <span>📶</span>
                <span>🔋 98%</span>
              </div>
            </div>
            {/* Actual screen */}
            <div className="flex-1 overflow-hidden relative">
              {mobileContent}
            </div>
          </div>
        </div>
        
        <p className="text-slate-400 text-[10px] mt-3 max-w-[280px] text-center select-none leading-relaxed">
          * Giao diện này sẽ hiển thị toàn màn hình (không có khung viền) khi nhân viên mở trên thiết bị di động thực tế.
        </p>
      </div>

      {/* 2. Mobile Mode (Direct rendering under md screen sizes) */}
      <div className="block md:hidden fixed inset-0 z-50 bg-[#f8fafc] w-full h-full">
        {mobileContent}
      </div>
    </>
  );
}

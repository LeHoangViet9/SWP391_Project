import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, ClipboardCheck, Layers3, LogOut, RefreshCw } from 'lucide-react';
import { getAllRooms } from '../services/roomService';
import { useLocale } from '../context/LocaleContext';
import CheckInManager from './CheckInManager';
import CheckOutManager from './CheckOutManager';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STYLES = {
  AVAILABLE: 'border-emerald-400 bg-emerald-100 text-emerald-800', READY: 'border-cyan-400 bg-cyan-100 text-cyan-800',
  RESERVED: 'border-amber-400 bg-amber-100 text-amber-800', OCCUPIED: 'border-red-400 bg-red-100 text-red-800',
  CLEANING: 'border-violet-400 bg-violet-100 text-violet-800', DIRTY: 'border-orange-400 bg-orange-100 text-orange-800',
  MAINTENANCE: 'border-slate-500 bg-slate-200 text-slate-800', CHECKOUT_PENDING: 'border-pink-400 bg-pink-100 text-pink-800',
  INACTIVE: 'border-stone-300 bg-stone-100 text-stone-500',
};
const LABELS = {
  AVAILABLE: 'Phòng trống', READY: 'Sẵn sàng', RESERVED: 'Đã đặt', OCCUPIED: 'Đang ở', CLEANING: 'Đang dọn',
  DIRTY: 'Chờ dọn', MAINTENANCE: 'Bảo trì', CHECKOUT_PENDING: 'Chờ trả phòng', INACTIVE: 'Ngừng hoạt động',
};
const statusOf = room => room.roomStatus || room.status || 'AVAILABLE';

export default function CheckInOutManager() {
  const { locale } = useLocale();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('checkin');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [preferredRoom, setPreferredRoom] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllRooms({ page: 0, size: 1000 }, locale);
      setRooms(result?.data?.content ?? []);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể tải bản đồ phòng.' });
    } finally { setLoading(false); }
  }, [locale]);
  useEffect(() => { loadRooms(); }, [loadRooms]);

  const floors = useMemo(() => Object.entries(rooms.reduce((all, room) => {
    const floor = Number(room.floorNumber || 0);
    (all[floor] ||= []).push(room);
    return all;
  }, {})).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, list]) =>
    [floor, list.sort((a, b) => String(a.roomNumber).localeCompare(String(b.roomNumber), undefined, { numeric: true }))]), [rooms]);

  function choose(action) {
    setActiveTab(action);
    setPreferredRoom(selectedRoom);
    setSelectedRoom(null);
    setTimeout(() => document.getElementById('checkin-checkout-workflow')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  return <div className="space-y-6">
    <Toast {...toast} onClose={() => setToast(t => ({ ...t, message: '' }))} />
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="text-lg font-bold text-slate-800">Bản đồ phòng</h2><p className="text-sm text-slate-500">Chọn một phòng để bắt đầu check-in hoặc check-out.</p></div>
        <button onClick={loadRooms} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới</button>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">{Object.entries(LABELS).map(([status, label]) =>
        <span key={status} className={`rounded-full border px-2.5 py-1 text-xs font-bold ${STYLES[status]}`}>{label}</span>)}</div>
      {loading ? <div className="py-16 text-center text-slate-500">Đang tải bản đồ phòng...</div> : floors.map(([floor, list]) =>
        <div key={floor} className="mb-5 overflow-hidden rounded-xl border">
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 font-bold text-white"><Layers3 size={17} /> Tầng {floor}</div>
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">{list.map(room => {
            const status = statusOf(room);
            return <button key={room.id} onClick={() => setSelectedRoom(room)} className={`relative min-h-24 rounded-xl border-2 p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${STYLES[status] || STYLES.INACTIVE}`}>
              <BedDouble className="mx-auto mb-1" size={22} /><b>{room.roomNumber}</b><p className="truncate text-[10px] opacity-75">{room.roomTypeName || room.roomType?.typeName || '-'}</p>
            </button>;
          })}</div>
        </div>)}
    </section>

    <section id="checkin-checkout-workflow">
      <div className="mb-4 flex gap-2 rounded-xl bg-stone-100 p-1">
        <button onClick={() => setActiveTab('checkin')} className={`flex-1 rounded-lg px-4 py-2 font-bold ${activeTab === 'checkin' ? 'bg-white text-[#9b7d3f] shadow' : 'text-slate-500'}`}><ClipboardCheck className="mr-2 inline" size={17} />Check-in</button>
        <button onClick={() => setActiveTab('checkout')} className={`flex-1 rounded-lg px-4 py-2 font-bold ${activeTab === 'checkout' ? 'bg-white text-[#9b7d3f] shadow' : 'text-slate-500'}`}><LogOut className="mr-2 inline" size={17} />Check-out</button>
      </div>
      {activeTab === 'checkin' ? <CheckInManager preferredRoom={preferredRoom} /> : <CheckOutManager preferredRoom={preferredRoom} />}
    </section>

    <Modal open={Boolean(selectedRoom)} title={selectedRoom ? `Phòng ${selectedRoom.roomNumber}` : 'Phòng'} onClose={() => setSelectedRoom(null)}>
      <p className="mb-4 text-sm text-slate-600">Trạng thái: <b>{selectedRoom ? LABELS[statusOf(selectedRoom)] || statusOf(selectedRoom) : '-'}</b></p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button disabled={!selectedRoom || !['AVAILABLE', 'READY', 'RESERVED'].includes(statusOf(selectedRoom))} onClick={() => choose('checkin')} className="rounded-lg bg-[#bfa15f] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><ClipboardCheck className="mr-2 inline" size={18} />Check-in phòng này</button>
        <button disabled={!selectedRoom || !['OCCUPIED', 'CHECKOUT_PENDING'].includes(statusOf(selectedRoom))} onClick={() => choose('checkout')} className="rounded-lg bg-emerald-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><LogOut className="mr-2 inline" size={18} />Check-out phòng này</button>
      </div>
    </Modal>
  </div>;
}

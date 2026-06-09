import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, CheckCircle, LogOut, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllBookings, createBooking, updateBooking, deleteBooking, searchBookings } from '../services/bookingService';
import { apiFetch } from '../services/api';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-700' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  { value: 'CHECKED_IN', label: 'Đã Check-in', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'CHECKED_OUT', label: 'Đã Check-out', color: 'bg-slate-100 text-slate-700' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  { value: 'NO_SHOW', label: 'Không đến', color: 'bg-orange-100 text-orange-700' },
];

const EMPTY = { customerId: '', roomTypeId: '', checkInDate: '', checkOutDate: '', quantity: 1 };

function toApiDateTime(value) {
  if (!value) return value;
  return value.length === 16 ? `${value}:00` : value;
}

function toInputDateTime(value) {
  return value ? value.substring(0, 16) : '';
}

function localDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getBookingStatus(item) {
  return item.bookingStatus || item.status || 'PENDING';
}

export default function BookingManager({ readOnly = false }) {
  const { hasRole } = useAuth();
  const isReceptionistOrAbove = hasRole('ADMIN', 'MANAGER', 'RECEPTIONIST');

  const [subTab, setSubTab] = useState('overview');
  const [items, setItems] = useState([]);
  const [todayCheckIns, setTodayCheckIns] = useState([]);
  const [todayCheckOuts, setTodayCheckOuts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('');
  const [filterRoomId, setFilterRoomId] = useState('');

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, size: 10 };
      let res;
      if (subTab === 'search') {
        res = await searchBookings({
          ...params,
          status: filterStatus || undefined,
          customerId: filterCustomerId ? Number(filterCustomerId) : undefined,
          roomTypeId: filterRoomTypeId ? Number(filterRoomTypeId) : undefined,
          roomId: filterRoomId ? Number(filterRoomId) : undefined,
        });
      } else {
        res = await getAllBookings(params);
      }
      setItems(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [subTab, filterStatus, filterCustomerId, filterRoomTypeId, filterRoomId, page]);

  const fetchTodayData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const checkInRes = await apiFetch(`/bookings/check-in?start=${localDateTime(start)}&end=${localDateTime(end)}&page=0&size=50`);
      setTodayCheckIns(checkInRes?.data?.content ?? []);

      const checkOutRes = await apiFetch(`/bookings/check-out?start=${localDateTime(start)}&end=${localDateTime(end)}&page=0&size=50`);
      setTodayCheckOuts(checkOutRes?.data?.content ?? []);
    } catch (e) {
      try {
        const res = await getAllBookings({ page: 0, size: 100 });
        const list = res?.data?.content ?? [];
        const todayStr = new Date().toDateString();
        setTodayCheckIns(list.filter(b => new Date(b.checkInDate).toDateString() === todayStr && getBookingStatus(b) === 'CONFIRMED'));
        setTodayCheckOuts(list.filter(b => new Date(b.checkOutDate).toDateString() === todayStr && getBookingStatus(b) === 'CHECKED_IN'));
      } catch (err) {
        notify(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (subTab === 'overview') fetchTodayData();
    else fetchData(page);
  }, [subTab, page, fetchData, fetchTodayData]);

  useEffect(() => {
    apiFetch('/customers?size=200&status=ACTIVE').then(r => setCustomers(r?.data?.content ?? [])).catch(() => {});
    apiFetch('/room-types?size=100').then(r => setRoomTypes(r?.data?.content ?? [])).catch(() => {});
    apiFetch('/rooms?size=200').then(r => setRooms(r?.data?.content ?? [])).catch(() => {});
  }, []);

  const openCreate = () => {
    if (!isReceptionistOrAbove) return notify('Bạn không có quyền tạo đặt phòng!', 'error');
    setForm(EMPTY);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    if (!isReceptionistOrAbove) return notify('Bạn không có quyền sửa đơn đặt phòng!', 'error');
    setForm({
      customerId: item.customerId || item.customer?.id || '',
      roomTypeId: item.roomTypeId || item.roomType?.id || '',
      checkInDate: toInputDateTime(item.checkInDate),
      checkOutDate: toInputDateTime(item.checkOutDate),
      quantity: item.quantity || 1,
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      customerId: Number(form.customerId),
      roomTypeId: Number(form.roomTypeId),
      checkInDate: toApiDateTime(form.checkInDate),
      checkOutDate: toApiDateTime(form.checkOutDate),
      quantity: Number(form.quantity),
    };

    try {
      if (modal.editing) {
        await updateBooking(modal.editing.id, payload);
        notify('Cập nhật đặt phòng thành công!');
      } else {
        await createBooking(payload);
        notify('Tạo đặt phòng thành công!');
      }
      closeModal();
      if (subTab === 'overview') fetchTodayData(); else fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? '403 Forbidden - Bạn không có quyền!' : (e.message || 'Lỗi không xác định'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!isReceptionistOrAbove) return notify('Bạn không có quyền xóa đặt phòng!', 'error');
    if (!window.confirm(`Xóa đặt phòng ID ${item.id}?`)) return;
    try {
      await deleteBooking(item.id);
      notify('Đã xóa đơn đặt phòng!');
      if (subTab === 'overview') fetchTodayData(); else fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? '403 Forbidden - Không có quyền xóa!' : e.message, 'error');
    }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  const renderStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${opt.color}`}>{opt.label}</span>;
  };

  const rows = items.map(item => {
    const status = getBookingStatus(item);
    return (
      <tr key={item.id} className="hover:bg-stone-50">
        <td className="px-4 py-3 font-mono text-xs font-bold">#{item.id}</td>
        <td className="px-4 py-3 text-sm font-semibold">{item.customerName || item.customer?.fullName || `Khách #${item.customerId}`}</td>
        <td className="px-4 py-3 text-xs text-slate-500">{item.roomTypeName || item.roomType?.typeName || 'Loại phòng'}</td>
        <td className="px-4 py-3 text-xs text-center">{item.quantity}</td>
        <td className="px-4 py-3 text-xs">{formatDate(item.checkInDate)}</td>
        <td className="px-4 py-3 text-xs">{formatDate(item.checkOutDate)}</td>
        <td className="px-4 py-3">{renderStatusBadge(status)}</td>
        <td className="px-4 py-3 text-[#bfa15f] font-bold text-xs">
          {item.totalPrice != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice) : '-'}
        </td>
        {!readOnly && isReceptionistOrAbove && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Chỉnh sửa"><Edit2 size={15} /></button>
              <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" title="Xóa"><Trash2 size={15} /></button>
            </div>
          </td>
        )}
      </tr>
    );
  });

  const cols = ['Mã Đơn', 'Khách Hàng', 'Loại Phòng', 'SL Phòng', 'Ngày Nhận', 'Ngày Trả', 'Trạng Thái', 'Tổng Tiền', ...(!readOnly && isReceptionistOrAbove ? ['Thao tác'] : [])];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex border-b border-stone-200 mb-6 gap-6">
        <button onClick={() => setSubTab('overview')} className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${subTab === 'overview' ? 'border-b-2 border-[#bfa15f] text-[#bfa15f]' : 'text-slate-500 hover:text-slate-800'}`}>
          <Calendar size={16} /> Hôm Nay
        </button>
        <button onClick={() => setSubTab('search')} className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${subTab === 'search' ? 'border-b-2 border-[#bfa15f] text-[#bfa15f]' : 'text-slate-500 hover:text-slate-800'}`}>
          <Filter size={16} /> Bộ Lọc Nâng Cao
        </button>
        <button onClick={() => setSubTab('all')} className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${subTab === 'all' ? 'border-b-2 border-[#bfa15f] text-[#bfa15f]' : 'text-slate-500 hover:text-slate-800'}`}>
          Tất Cả Đặt Phòng
        </button>
      </div>

      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <CheckCircle size={18} className="text-emerald-500" /> Nhận Phòng Hôm Nay ({todayCheckIns.length})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {todayCheckIns.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Không có lượt nhận phòng hôm nay.</p>
              ) : todayCheckIns.map(item => (
                <div key={item.id} className="p-3 bg-stone-50 rounded border hover:shadow-sm transition-shadow">
                  <p className="text-sm font-semibold">{item.customerName || `Khách #${item.customerId}`}</p>
                  <p className="text-xs text-slate-500">{item.roomTypeName} - SL: <span className="font-bold">{item.quantity}</span></p>
                  <p className="text-xs text-slate-400">{formatDate(item.checkInDate)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <LogOut size={18} className="text-blue-500" /> Trả Phòng Hôm Nay ({todayCheckOuts.length})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {todayCheckOuts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Không có lượt trả phòng hôm nay.</p>
              ) : todayCheckOuts.map(item => (
                <div key={item.id} className="p-3 bg-stone-50 rounded border hover:shadow-sm transition-shadow">
                  <p className="text-sm font-semibold">{item.customerName || `Khách #${item.customerId}`}</p>
                  <p className="text-xs text-slate-500">{item.roomTypeName} - SL: <span className="font-bold">{item.quantity}</span></p>
                  <p className="text-xs text-slate-400">{formatDate(item.checkOutDate)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'search' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-stone-50 rounded-lg border">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Trạng Thái</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">-- Tất cả --</option>
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Khách Hàng</label>
              <select value={filterCustomerId} onChange={e => setFilterCustomerId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">-- Tất cả --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Loại Phòng</label>
              <select value={filterRoomTypeId} onChange={e => setFilterRoomTypeId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">-- Tất cả --</option>
                {roomTypes.map(r => <option key={r.id} value={r.id}>{r.typeName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Số Phòng</label>
              <select value={filterRoomId} onChange={e => setFilterRoomId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">-- Tất cả --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => { setFilterStatus(''); setFilterCustomerId(''); setFilterRoomTypeId(''); setFilterRoomId(''); }} className="px-4 py-2 border rounded text-sm hover:bg-stone-100">Xóa Bộ Lọc</button>
            <button onClick={() => fetchData(0)} className="px-5 py-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded text-sm font-semibold shadow">Tìm Kiếm</button>
          </div>

          <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {subTab === 'all' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100"><RefreshCw size={14} /></button>
            {!readOnly && isReceptionistOrAbove && (
              <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow">
                <Plus size={16} /> Tạo đơn đặt phòng
              </button>
            )}
          </div>
          <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modal.open} title={modal.editing ? 'Cập Nhật Đơn Đặt Phòng' : 'Tạo Đơn Đặt Phòng Mới'} onClose={closeModal} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Khách Hàng *</label>
              <select required value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                <option value="">-- Chọn khách hàng --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} ({c.phone || c.email || 'N/A'})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Loại Phòng *</label>
              <select required value={form.roomTypeId} onChange={e => setForm(f => ({ ...f, roomTypeId: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                <option value="">-- Chọn loại phòng --</option>
                {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.typeName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Ngày Nhận Phòng *</label>
              <input required type="datetime-local" value={form.checkInDate} onChange={e => setForm(f => ({ ...f, checkInDate: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Ngày Trả Phòng *</label>
              <input required type="datetime-local" value={form.checkOutDate} onChange={e => setForm(f => ({ ...f, checkOutDate: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Số Phòng Đặt *</label>
            <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">Hủy</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

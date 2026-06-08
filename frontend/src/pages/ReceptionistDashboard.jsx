import { useState, useEffect, useCallback } from 'react';
import { LogIn, LogOut, Clock, CalendarCheck, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardShell from '../components/layout/DashboardShell';
import StatCard from '../components/dashboard/StatCard';
import MapChart from '../components/dashboard/MapChart';
import SearchBar from '../components/common/SearchBar';
import FilterSelect from '../components/common/FilterSelect';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { useLocale } from '../context/LocaleContext';
import { getReceptionistDashboard } from '../services/dashboardService';
import {
  searchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../services/bookingService';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../services/customerService';
import { BOOKING_STATUS, ACCOUNT_STATUS, ID_TYPE } from '../constants/enums';
import { formatCurrency, formatDateTime, toDateTimeLocalValue, fromDateTimeLocalValue } from '../utils/format';

const TABS = [
  { id: 'overview', label: 'Tổng quan vận hành' },
  { id: 'bookings', label: 'Quản lý đặt phòng' },
  { id: 'customers', label: 'Quản lý khách hàng' },
];

export default function ReceptionistDashboard() {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState('overview');

  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const [bkKeyword, setBkKeyword] = useState('');
  const [bkFilters, setBkFilters] = useState({ page: 1, size: 10, status: '', customerId: '', roomTypeId: '' });
  const [bookings, setBookings] = useState([]);
  const [bkPage, setBkPage] = useState({ totalPages: 0, totalElements: 0 });
  const [bkLoading, setBkLoading] = useState(false);

  const [cusKeyword, setCusKeyword] = useState('');
  const [cusFilters, setCusFilters] = useState({ page: 1, size: 10, status: '' });
  const [customers, setCustomers] = useState([]);
  const [cusPage, setCusPage] = useState({ totalPages: 0, totalElements: 0 });
  const [cusLoading, setCusLoading] = useState(false);

  const [bkModal, setBkModal] = useState({ open: false, mode: 'create', id: null });
  const [bkForm, setBkForm] = useState({ customerId: '', roomTypeId: '', checkInDate: '', checkOutDate: '', quantity: 1 });

  const [cusModal, setCusModal] = useState({ open: false, mode: 'create', id: null });
  const [cusForm, setCusForm] = useState({ fullName: '', email: '', phone: '', idType: 'CCCD', idNumberCard: '', nationality: 'Việt Nam' });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setDashLoading(true);
      try {
        const res = await getReceptionistDashboard(locale);
        if (!cancelled) setDashData(res?.data);
      } catch {
        if (!cancelled) setDashData(null);
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [locale]);

  const loadBookings = useCallback(async () => {
    setBkLoading(true);
    try {
      const res = await searchBookings({
        status: bkFilters.status || undefined,
        customerId: bkFilters.customerId || undefined,
        roomTypeId: bkFilters.roomTypeId || undefined,
        page: bkFilters.page,
        size: bkFilters.size,
      }, locale);
      setBookings(res?.data?.content || []);
      setBkPage({
        totalPages: res?.data?.totalPages ?? 0,
        totalElements: res?.data?.totalElements ?? 0,
      });
    } catch {
      setBookings([]);
    } finally {
      setBkLoading(false);
    }
  }, [locale, bkFilters]);

  const loadCustomers = useCallback(async () => {
    setCusLoading(true);
    try {
      const res = await getCustomers({
        keywords: cusKeyword || undefined,
        status: cusFilters.status || undefined,
        page: cusFilters.page,
        size: cusFilters.size,
      }, locale);
      setCustomers(res?.data?.content || []);
      setCusPage({
        totalPages: res?.data?.totalPages ?? 0,
        totalElements: res?.data?.totalElements ?? 0,
      });
    } catch {
      setCustomers([]);
    } finally {
      setCusLoading(false);
    }
  }, [locale, cusKeyword, cusFilters]);

  useEffect(() => {
    if (activeTab === 'bookings') loadBookings();
  }, [activeTab, loadBookings]);

  useEffect(() => {
    if (activeTab === 'customers') loadCustomers();
  }, [activeTab, loadCustomers]);

  const saveBooking = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      customerId: Number(bkForm.customerId),
      roomTypeId: Number(bkForm.roomTypeId),
      checkInDate: fromDateTimeLocalValue(bkForm.checkInDate),
      checkOutDate: fromDateTimeLocalValue(bkForm.checkOutDate),
      quantity: Number(bkForm.quantity),
    };
    try {
      if (bkModal.mode === 'create') {
        await createBooking(payload, locale);
        setSuccess('Đã tạo đặt phòng');
      } else {
        await updateBooking(bkModal.id, payload, locale);
        setSuccess('Đã cập nhật đặt phòng');
      }
      setBkModal({ open: false, mode: 'create', id: null });
      loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (cusModal.mode === 'create') {
        await createCustomer(cusForm, locale);
        setSuccess('Đã thêm khách hàng');
      } else {
        await updateCustomer(cusModal.id, cusForm, locale);
        setSuccess('Đã cập nhật khách hàng');
      }
      setCusModal({ open: false, mode: 'create', id: null });
      loadCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === 'booking') await deleteBooking(deleteTarget.id, locale);
      if (deleteTarget.type === 'customer') await deleteCustomer(deleteTarget.id, locale);
      setSuccess('Đã xóa');
      setDeleteTarget(null);
      if (deleteTarget.type === 'booking') loadBookings();
      if (deleteTarget.type === 'customer') loadCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const bkColumns = [
    { key: 'id', title: 'ID', className: 'w-14' },
    { key: 'customerName', title: 'Khách' },
    { key: 'roomTypeName', title: 'Loại phòng' },
    { key: 'checkInDate', title: 'Check-in', render: (r) => formatDateTime(r.checkInDate) },
    { key: 'totalPrice', title: 'Tổng', render: (r) => formatCurrency(r.totalPrice) },
    { key: 'bookingStatus', title: 'TT', render: (r) => <StatusBadge status={r.bookingStatus} /> },
    {
      key: 'actions',
      title: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setBkForm({ customerId: String(r.customerId), roomTypeId: String(r.roomTypeId), checkInDate: toDateTimeLocalValue(r.checkInDate), checkOutDate: toDateTimeLocalValue(r.checkOutDate), quantity: r.quantity }); setBkModal({ open: true, mode: 'edit', id: r.id }); }} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil size={15} /></button>
          <button type="button" onClick={() => setDeleteTarget({ type: 'booking', id: r.id })} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  const cusColumns = [
    { key: 'id', title: 'ID', className: 'w-14' },
    { key: 'fullName', title: 'Họ tên' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Điện thoại' },
    { key: 'status', title: 'TT', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      title: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => { setCusForm({ fullName: r.fullName, email: r.email, phone: r.phone, idType: 'CCCD', idNumberCard: r.idCard || '', nationality: r.nationality || 'Việt Nam' }); setCusModal({ open: true, mode: 'edit', id: r.id }); }} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil size={15} /></button>
          <button type="button" onClick={() => setDeleteTarget({ type: 'customer', id: r.id })} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell title="Bảng điều khiển Lễ tân">
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg ${activeTab === tab.id ? 'bg-[#bfa15f] text-white' : 'bg-white border border-stone-200 text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {dashLoading ? (
            <div className="text-center py-12 text-slate-400">Đang tải...</div>
          ) : dashData && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard title="Check-in dự kiến" value={dashData.expectedCheckIns ?? 0} icon={LogIn} />
                <StatCard title="Check-in thực tế" value={dashData.actualCheckIns ?? 0} icon={LogIn} accent="green" />
                <StatCard title="Check-out dự kiến" value={dashData.expectedCheckOuts ?? 0} icon={LogOut} accent="blue" />
                <StatCard title="Check-out thực tế" value={dashData.actualCheckOuts ?? 0} icon={LogOut} accent="purple" />
                <StatCard title="Đơn PENDING" value={dashData.pendingBookings ?? 0} icon={Clock} accent="red" />
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarCheck size={20} className="text-[#bfa15f]" /> Tổng quan trạng thái phòng
                </h2>
                <MapChart data={dashData.roomStatusOverview} />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-stone-200">
            <h2 className="font-display text-lg font-semibold">Đặt phòng</h2>
            <button type="button" onClick={() => { setBkForm({ customerId: '', roomTypeId: '', checkInDate: '', checkOutDate: '', quantity: 1 }); setBkModal({ open: true, mode: 'create', id: null }); }} className="inline-flex items-center gap-2 btn-gold px-4 py-2 rounded-lg text-sm">
              <Plus size={16} /> Tạo đặt phòng
            </button>
          </div>
          <div className="flex flex-wrap gap-3 p-4 border-b border-stone-100">
            <FilterSelect label="Trạng thái" value={bkFilters.status} onChange={(v) => setBkFilters((f) => ({ ...f, status: v, page: 1 }))} options={BOOKING_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs font-semibold text-slate-500 uppercase">ID Khách</label>
              <input type="number" value={bkFilters.customerId} onChange={(e) => setBkFilters((f) => ({ ...f, customerId: e.target.value, page: 1 }))} className="border rounded-lg px-3 py-2 text-sm" placeholder="Tất cả" />
            </div>
            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs font-semibold text-slate-500 uppercase">ID Loại phòng</label>
              <input type="number" value={bkFilters.roomTypeId} onChange={(e) => setBkFilters((f) => ({ ...f, roomTypeId: e.target.value, page: 1 }))} className="border rounded-lg px-3 py-2 text-sm" placeholder="Tất cả" />
            </div>
          </div>
          <DataTable columns={bkColumns} data={bookings} loading={bkLoading} />
          <Pagination page={bkFilters.page} totalPages={bkPage.totalPages} totalElements={bkPage.totalElements} onPageChange={(p) => setBkFilters((f) => ({ ...f, page: p }))} />
        </section>
      )}

      {activeTab === 'customers' && (
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-stone-200">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><Users size={20} /> Khách hàng</h2>
            <button type="button" onClick={() => { setCusForm({ fullName: '', email: '', phone: '', idType: 'CCCD', idNumberCard: '', nationality: 'Việt Nam' }); setCusModal({ open: true, mode: 'create', id: null }); }} className="inline-flex items-center gap-2 btn-gold px-4 py-2 rounded-lg text-sm">
              <Plus size={16} /> Thêm khách
            </button>
          </div>
          <div className="flex flex-wrap gap-3 p-4 border-b border-stone-100">
            <SearchBar value={cusKeyword} onChange={setCusKeyword} onSubmit={() => { setCusFilters((f) => ({ ...f, page: 1 })); loadCustomers(); }} />
            <FilterSelect label="Trạng thái" value={cusFilters.status} onChange={(v) => setCusFilters((f) => ({ ...f, status: v, page: 1 }))} options={ACCOUNT_STATUS.map((s) => ({ value: s, label: s }))} />
          </div>
          <DataTable columns={cusColumns} data={customers} loading={cusLoading} />
          <Pagination page={cusFilters.page} totalPages={cusPage.totalPages} totalElements={cusPage.totalElements} onPageChange={(p) => setCusFilters((f) => ({ ...f, page: p }))} />
        </section>
      )}

      <Modal open={bkModal.open} onClose={() => setBkModal({ open: false, mode: 'create', id: null })} title={bkModal.mode === 'create' ? 'Tạo đặt phòng' : 'Sửa đặt phòng'} size="lg">
        <form onSubmit={saveBooking} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">ID Khách *</label>
              <input type="number" required value={bkForm.customerId} onChange={(e) => setBkForm({ ...bkForm, customerId: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">ID Loại phòng *</label>
              <input type="number" required value={bkForm.roomTypeId} onChange={(e) => setBkForm({ ...bkForm, roomTypeId: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Check-in *</label>
              <input type="datetime-local" required value={bkForm.checkInDate} onChange={(e) => setBkForm({ ...bkForm, checkInDate: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Check-out *</label>
              <input type="datetime-local" required value={bkForm.checkOutDate} onChange={(e) => setBkForm({ ...bkForm, checkOutDate: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Số lượng *</label>
            <input type="number" min={1} required value={bkForm.quantity} onChange={(e) => setBkForm({ ...bkForm, quantity: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm max-w-[120px]" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setBkModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-60">Lưu</button>
          </div>
        </form>
      </Modal>

      <Modal open={cusModal.open} onClose={() => setCusModal({ open: false, mode: 'create', id: null })} title={cusModal.mode === 'create' ? 'Thêm khách hàng' : 'Sửa khách hàng'} size="lg">
        <form onSubmit={saveCustomer} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Họ tên *</label>
            <input required value={cusForm.fullName} onChange={(e) => setCusForm({ ...cusForm, fullName: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Email *</label>
              <input type="email" required value={cusForm.email} onChange={(e) => setCusForm({ ...cusForm, email: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Điện thoại *</label>
              <input required pattern="0[0-9]{9}" value={cusForm.phone} onChange={(e) => setCusForm({ ...cusForm, phone: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Loại GT *</label>
              <select value={cusForm.idType} onChange={(e) => setCusForm({ ...cusForm, idType: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                {ID_TYPE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Số GT *</label>
              <input required pattern="[A-Za-z0-9\-]{6,20}" value={cusForm.idNumberCard} onChange={(e) => setCusForm({ ...cusForm, idNumberCard: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Quốc tịch *</label>
            <input required value={cusForm.nationality} onChange={(e) => setCusForm({ ...cusForm, nationality: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCusModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-60">Lưu</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Bạn có chắc muốn xóa?</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
          <button type="button" onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Xóa</button>
        </div>
      </Modal>
    </DashboardShell>
  );
}

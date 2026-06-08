import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, CalendarCheck, BedDouble, Layers, Cpu, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import DashboardShell from '../components/layout/DashboardShell';
import StatCard from '../components/dashboard/StatCard';
import LineChart from '../components/dashboard/LineChart';
import MapChart from '../components/dashboard/MapChart';
import SearchBar from '../components/common/SearchBar';
import FilterSelect from '../components/common/FilterSelect';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { useLocale } from '../context/LocaleContext';
import { getAdminDashboard } from '../services/dashboardService';
import {
  getAllRooms,
  getRoomsByStatus,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomById,
} from '../services/roomService';
import {
  getAllRoomTypes,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from '../services/roomTypeService';
import {
  getAllEquipments,
  findById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from '../services/equipmentService';
import { ROOM_STATUS, SORT_FIELDS, SORT_DIRECTIONS } from '../constants/enums';
import { formatCurrency } from '../utils/format';

const TABS = [
  { id: 'finance', label: 'Thống kê tài chính', icon: DollarSign },
  { id: 'rooms', label: 'Quản lý Phòng & Loại phòng', icon: BedDouble },
  { id: 'equipment', label: 'Quản lý Thiết bị', icon: Cpu },
];

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#bfa15f] text-white shadow-sm'
          : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminDashboard() {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState('finance');

  // —— Tab 1: Finance ——
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState('');

  // —— Tab 2: Rooms ——
  const [roomKeyword, setRoomKeyword] = useState('');
  const [roomFilters, setRoomFilters] = useState({ page: 1, size: 8, status: '', sortBy: 'ID', direction: 'ASC' });
  const [rooms, setRooms] = useState([]);
  const [roomPage, setRoomPage] = useState({ totalPages: 0, totalElements: 0 });
  const [roomsLoading, setRoomsLoading] = useState(false);

  const [rtKeyword, setRtKeyword] = useState('');
  const [rtFilters, setRtFilters] = useState({ page: 1, size: 8, maxGuests: '', sortBy: 'ID', direction: 'ASC' });
  const [roomTypes, setRoomTypes] = useState([]);
  const [rtPage, setRtPage] = useState({ totalPages: 0, totalElements: 0 });
  const [rtLoading, setRtLoading] = useState(false);

  const [roomModal, setRoomModal] = useState({ open: false, mode: 'create', id: null });
  const [roomForm, setRoomForm] = useState({ roomNumber: '', roomTypeId: '', floorNumber: '', description: '' });
  const [roomFile, setRoomFile] = useState(null);
  const [roomPreview, setRoomPreview] = useState('');

  const [rtModal, setRtModal] = useState({ open: false, mode: 'create', id: null });
  const [rtForm, setRtForm] = useState({ typeName: '', description: '', basePrice: '', maxGuests: '' });

  // —— Tab 3: Equipment ——
  const [eqKeyword, setEqKeyword] = useState('');
  const [eqFilters, setEqFilters] = useState({ page: 1, size: 10, sortBy: 'ID', direction: 'ASC' });
  const [equipments, setEquipments] = useState([]);
  const [eqPage, setEqPage] = useState({ totalPages: 0, totalElements: 0 });
  const [eqLoading, setEqLoading] = useState(false);
  const [eqModal, setEqModal] = useState({ open: false, mode: 'create', id: null });
  const [eqForm, setEqForm] = useState({ equipmentName: '', equipmentCode: '', location: '', description: '', roomId: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDash() {
      setDashLoading(true);
      setDashError('');
      try {
        const res = await getAdminDashboard(locale);
        if (!cancelled) setDashData(res?.data);
      } catch (err) {
        if (!cancelled) setDashError(err.message || 'Không thể tải dashboard');
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    }
    loadDash();
    return () => { cancelled = true; };
  }, [locale]);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const params = { page: roomFilters.page, size: roomFilters.size };
      let res;
      if (roomFilters.status) {
        res = await getRoomsByStatus(roomFilters.status, params, locale);
      } else {
        res = await getAllRooms({
          keywords: roomKeyword || undefined,
          ...params,
          sortBy: roomFilters.sortBy,
          direction: roomFilters.direction,
        }, locale);
      }
      setRooms(res?.data?.content || []);
      setRoomPage({
        totalPages: res?.data?.totalPages ?? 0,
        totalElements: res?.data?.totalElements ?? 0,
      });
    } catch {
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, [locale, roomKeyword, roomFilters]);

  const loadRoomTypes = useCallback(async () => {
    setRtLoading(true);
    try {
      const res = await getAllRoomTypes({
        keywords: rtKeyword || undefined,
        maxGuests: rtFilters.maxGuests || undefined,
        page: rtFilters.page,
        size: rtFilters.size,
        sortBy: rtFilters.sortBy,
        direction: rtFilters.direction,
      }, locale);
      setRoomTypes(res?.data?.content || []);
      setRtPage({
        totalPages: res?.data?.totalPages ?? 0,
        totalElements: res?.data?.totalElements ?? 0,
      });
    } catch {
      setRoomTypes([]);
    } finally {
      setRtLoading(false);
    }
  }, [locale, rtKeyword, rtFilters]);

  const loadEquipments = useCallback(async () => {
    setEqLoading(true);
    try {
      const res = await getAllEquipments({
        keywords: eqKeyword || undefined,
        page: eqFilters.page,
        size: eqFilters.size,
        sortBy: eqFilters.sortBy,
        direction: eqFilters.direction,
      }, locale);
      setEquipments(res?.data?.content || []);
      setEqPage({
        totalPages: res?.data?.totalPages ?? 0,
        totalElements: res?.data?.totalElements ?? 0,
      });
    } catch {
      setEquipments([]);
    } finally {
      setEqLoading(false);
    }
  }, [locale, eqKeyword, eqFilters]);

  useEffect(() => {
    if (activeTab === 'rooms') {
      loadRooms();
      loadRoomTypes();
    }
  }, [activeTab, loadRooms, loadRoomTypes]);

  useEffect(() => {
    if (activeTab === 'equipment') loadEquipments();
  }, [activeTab, loadEquipments]);

  const openRoomCreate = () => {
    setRoomForm({ roomNumber: '', roomTypeId: '', floorNumber: '', description: '' });
    setRoomFile(null);
    setRoomPreview('');
    setRoomModal({ open: true, mode: 'create', id: null });
  };

  const openRoomEdit = async (id) => {
    setActionError('');
    try {
      const res = await getRoomById(id, locale);
      const r = res?.data;
      setRoomForm({
        roomNumber: r.roomNumber || '',
        roomTypeId: String(r.roomType?.id || ''),
        floorNumber: String(r.floorNumber || ''),
        description: r.description || '',
      });
      setRoomPreview(r.imageRoom || '');
      setRoomFile(null);
      setRoomModal({ open: true, mode: 'edit', id });
    } catch (err) {
      setActionError(err.message);
    }
  };

  const saveRoom = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');
    const payload = {
      roomNumber: roomForm.roomNumber,
      roomTypeId: Number(roomForm.roomTypeId),
      floorNumber: Number(roomForm.floorNumber),
      description: roomForm.description || undefined,
    };
    try {
      if (roomModal.mode === 'create') {
        if (!roomFile) throw new Error('Vui lòng chọn ảnh phòng');
        await createRoom(payload, roomFile, locale);
        setActionSuccess('Đã tạo phòng mới');
      } else {
        await updateRoom(roomModal.id, payload, roomFile, locale);
        setActionSuccess('Đã cập nhật phòng');
      }
      setRoomModal({ open: false, mode: 'create', id: null });
      loadRooms();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openRtCreate = () => {
    setRtForm({ typeName: '', description: '', basePrice: '', maxGuests: '' });
    setRtModal({ open: true, mode: 'create', id: null });
  };

  const openRtEdit = (rt) => {
    setRtForm({
      typeName: rt.typeName || '',
      description: rt.description || '',
      basePrice: String(rt.basePrice || ''),
      maxGuests: String(rt.maxGuests || ''),
    });
    setRtModal({ open: true, mode: 'edit', id: rt.id });
  };

  const saveRoomType = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');
    const payload = {
      typeName: rtForm.typeName,
      description: rtForm.description || undefined,
      basePrice: Number(rtForm.basePrice),
      maxGuests: Number(rtForm.maxGuests),
    };
    try {
      if (rtModal.mode === 'create') {
        await createRoomType(payload, locale);
        setActionSuccess('Đã tạo loại phòng');
      } else {
        await updateRoomType(rtModal.id, payload, locale);
        setActionSuccess('Đã cập nhật loại phòng');
      }
      setRtModal({ open: false, mode: 'create', id: null });
      loadRoomTypes();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEqCreate = () => {
    setEqForm({ equipmentName: '', equipmentCode: '', location: '', description: '', roomId: '' });
    setEqModal({ open: true, mode: 'create', id: null });
  };

  const openEqEdit = async (id) => {
    try {
      const res = await findById(id, locale);
      const eq = res?.data;
      setEqForm({
        equipmentName: eq.equipmentName || '',
        equipmentCode: eq.equipmentCode || '',
        location: eq.location || '',
        description: eq.description || '',
        roomId: String(eq.roomId || ''),
      });
      setEqModal({ open: true, mode: 'edit', id });
    } catch (err) {
      setActionError(err.message);
    }
  };

  const saveEquipment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');
    const payload = {
      equipmentName: eqForm.equipmentName,
      equipmentCode: eqForm.equipmentCode,
      location: eqForm.location,
      description: eqForm.description || undefined,
      roomId: eqForm.roomId ? Number(eqForm.roomId) : null,
    };
    try {
      if (eqModal.mode === 'create') {
        await createEquipment(payload, locale);
        setActionSuccess('Đã thêm thiết bị');
      } else {
        await updateEquipment(eqModal.id, payload, locale);
        setActionSuccess('Đã cập nhật thiết bị');
      }
      setEqModal({ open: false, mode: 'create', id: null });
      loadEquipments();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setActionError('');
    try {
      if (deleteTarget.type === 'room') await deleteRoom(deleteTarget.id, locale);
      if (deleteTarget.type === 'roomType') await deleteRoomType(deleteTarget.id, locale);
      if (deleteTarget.type === 'equipment') await deleteEquipment(deleteTarget.id, locale);
      setActionSuccess('Đã xóa thành công');
      setDeleteTarget(null);
      if (deleteTarget.type === 'room') loadRooms();
      if (deleteTarget.type === 'roomType') loadRoomTypes();
      if (deleteTarget.type === 'equipment') loadEquipments();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const roomColumns = [
    { key: 'id', title: 'ID', className: 'w-14' },
    { key: 'roomNumber', title: 'Số phòng' },
    { key: 'roomType', title: 'Loại', render: (r) => r.roomType?.typeName || '—' },
    { key: 'floorNumber', title: 'Tầng' },
    { key: 'roomStatus', title: 'Trạng thái', render: (r) => <StatusBadge status={r.roomStatus} /> },
    {
      key: 'actions',
      title: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openRoomEdit(r.id)} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil size={15} /></button>
          <button type="button" onClick={() => setDeleteTarget({ type: 'room', id: r.id })} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  const rtColumns = [
    { key: 'id', title: 'ID', className: 'w-14' },
    { key: 'typeName', title: 'Tên loại' },
    { key: 'basePrice', title: 'Giá', render: (r) => formatCurrency(r.basePrice) },
    { key: 'maxGuests', title: 'Khách tối đa' },
    { key: 'status', title: 'TT', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      title: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openRtEdit(r)} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil size={15} /></button>
          <button type="button" onClick={() => setDeleteTarget({ type: 'roomType', id: r.id })} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  const eqColumns = [
    { key: 'id', title: 'ID', className: 'w-14' },
    { key: 'equipmentName', title: 'Tên' },
    { key: 'equipmentCode', title: 'Mã' },
    { key: 'location', title: 'Vị trí' },
    { key: 'status', title: 'Trạng thái', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      title: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openEqEdit(r.id)} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil size={15} /></button>
          <button type="button" onClick={() => setDeleteTarget({ type: 'equipment', id: r.id })} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell title="Bảng điều khiển Quản trị">
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            <span className="flex items-center gap-2">
              <tab.icon size={16} />
              {tab.label}
            </span>
          </TabButton>
        ))}
      </div>

      <Alert type="error" message={actionError} onClose={() => setActionError('')} />
      <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />

      {activeTab === 'finance' && (
        <div className="space-y-6">
          {dashError && <Alert type="error" message={dashError} />}
          {dashLoading ? (
            <div className="text-center py-16 text-slate-400">Đang tải thống kê...</div>
          ) : dashData && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Doanh thu hôm nay" value={formatCurrency(dashData.todayRevenue)} icon={DollarSign} />
                <StatCard title="Doanh thu tháng này" value={formatCurrency(dashData.thisMonthRevenue)} icon={TrendingUp} accent="green" />
                <StatCard title="Tổng doanh thu" value={formatCurrency(dashData.totalRevenueAllTime)} icon={DollarSign} accent="blue" />
                <StatCard title="Đặt phòng thành công" value={dashData.totalSuccessfulBookings ?? 0} icon={CalendarCheck} accent="purple" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
                  <h2 className="font-display text-lg font-semibold mb-4">Xu hướng doanh thu 7 ngày</h2>
                  <LineChart data={dashData.revenueTrend || []} />
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
                  <MapChart title="Đặt phòng theo loại phòng" data={dashData.bookingsCountByRoomType} />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
                <MapChart title="Doanh thu theo phương thức thanh toán" data={dashData.revenueByPaymentMethod} />
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-stone-200">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <BedDouble size={20} className="text-[#bfa15f]" /> Danh sách phòng
              </h2>
              <button type="button" onClick={openRoomCreate} className="inline-flex items-center gap-2 btn-gold px-4 py-2 rounded-lg text-sm">
                <Plus size={16} /> Thêm phòng
              </button>
            </div>
            <div className="flex flex-wrap gap-3 p-4 border-b border-stone-100">
              <SearchBar value={roomKeyword} onChange={setRoomKeyword} onSubmit={() => { setRoomFilters((f) => ({ ...f, page: 1 })); loadRooms(); }} placeholder="Tìm số phòng..." />
              <FilterSelect label="Trạng thái" value={roomFilters.status} onChange={(v) => setRoomFilters((f) => ({ ...f, status: v, page: 1 }))} options={ROOM_STATUS.map((s) => ({ value: s, label: s }))} />
            </div>
            <DataTable columns={roomColumns} data={rooms} loading={roomsLoading} />
            <Pagination page={roomFilters.page} totalPages={roomPage.totalPages} totalElements={roomPage.totalElements} onPageChange={(p) => setRoomFilters((f) => ({ ...f, page: p }))} />
          </section>

          <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-stone-200">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Layers size={20} className="text-[#bfa15f]" /> Loại phòng
              </h2>
              <button type="button" onClick={openRtCreate} className="inline-flex items-center gap-2 btn-gold px-4 py-2 rounded-lg text-sm">
                <Plus size={16} /> Thêm loại phòng
              </button>
            </div>
            <div className="p-4 border-b border-stone-100">
              <SearchBar value={rtKeyword} onChange={setRtKeyword} onSubmit={() => { setRtFilters((f) => ({ ...f, page: 1 })); loadRoomTypes(); }} placeholder="Tìm loại phòng..." />
            </div>
            <DataTable columns={rtColumns} data={roomTypes} loading={rtLoading} />
            <Pagination page={rtFilters.page} totalPages={rtPage.totalPages} totalElements={rtPage.totalElements} onPageChange={(p) => setRtFilters((f) => ({ ...f, page: p }))} />
          </section>
        </div>
      )}

      {activeTab === 'equipment' && (
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-stone-200">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Cpu size={20} className="text-[#bfa15f]" /> Thiết bị
            </h2>
            <button type="button" onClick={openEqCreate} className="inline-flex items-center gap-2 btn-gold px-4 py-2 rounded-lg text-sm">
              <Plus size={16} /> Thêm thiết bị
            </button>
          </div>
          <div className="flex flex-wrap gap-3 p-4 border-b border-stone-100">
            <SearchBar value={eqKeyword} onChange={setEqKeyword} onSubmit={() => { setEqFilters((f) => ({ ...f, page: 1 })); loadEquipments(); }} placeholder="Tìm thiết bị..." />
            <FilterSelect label="Sắp xếp" value={eqFilters.sortBy} onChange={(v) => setEqFilters((f) => ({ ...f, sortBy: v, page: 1 }))} options={SORT_FIELDS} allLabel="ID" />
            <FilterSelect label="Thứ tự" value={eqFilters.direction} onChange={(v) => setEqFilters((f) => ({ ...f, direction: v, page: 1 }))} options={SORT_DIRECTIONS} allLabel="ASC" />
          </div>
          <DataTable columns={eqColumns} data={equipments} loading={eqLoading} />
          <Pagination page={eqFilters.page} totalPages={eqPage.totalPages} totalElements={eqPage.totalElements} onPageChange={(p) => setEqFilters((f) => ({ ...f, page: p }))} />
        </section>
      )}

      {/* Room Modal */}
      <Modal open={roomModal.open} onClose={() => setRoomModal({ open: false, mode: 'create', id: null })} title={roomModal.mode === 'create' ? 'Thêm phòng' : 'Sửa phòng'} size="lg">
        <form onSubmit={saveRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Số phòng *</label>
              <input required value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Loại phòng *</label>
              <select required value={roomForm.roomTypeId} onChange={(e) => setRoomForm({ ...roomForm, roomTypeId: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Chọn</option>
                {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.typeName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Tầng *</label>
            <input type="number" min={1} required value={roomForm.floorNumber} onChange={(e) => setRoomForm({ ...roomForm, floorNumber: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm max-w-[120px]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Mô tả</label>
            <textarea rows={2} value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Ảnh {roomModal.mode === 'create' && '*'}</label>
            <div className="flex gap-3 mt-1">
              {roomPreview && <img src={roomPreview} alt="" className="w-20 h-20 object-cover rounded border" />}
              <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#bfa15f]">
                <Upload size={18} className="text-slate-400" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setRoomFile(f); setRoomPreview(URL.createObjectURL(f)); } }} />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRoomModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </Modal>

      {/* RoomType Modal */}
      <Modal open={rtModal.open} onClose={() => setRtModal({ open: false, mode: 'create', id: null })} title={rtModal.mode === 'create' ? 'Thêm loại phòng' : 'Sửa loại phòng'}>
        <form onSubmit={saveRoomType} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Tên *</label>
            <input required value={rtForm.typeName} onChange={(e) => setRtForm({ ...rtForm, typeName: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Giá *</label>
              <input type="number" min={1} required value={rtForm.basePrice} onChange={(e) => setRtForm({ ...rtForm, basePrice: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Khách tối đa *</label>
              <input type="number" min={1} required value={rtForm.maxGuests} onChange={(e) => setRtForm({ ...rtForm, maxGuests: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Mô tả</label>
            <textarea rows={2} value={rtForm.description} onChange={(e) => setRtForm({ ...rtForm, description: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setRtModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </Modal>

      {/* Equipment Modal */}
      <Modal open={eqModal.open} onClose={() => setEqModal({ open: false, mode: 'create', id: null })} title={eqModal.mode === 'create' ? 'Thêm thiết bị' : 'Sửa thiết bị'}>
        <form onSubmit={saveEquipment} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Tên *</label>
            <input required value={eqForm.equipmentName} onChange={(e) => setEqForm({ ...eqForm, equipmentName: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Mã *</label>
              <input required pattern="[A-Za-z0-9\-]{2,30}" value={eqForm.equipmentCode} onChange={(e) => setEqForm({ ...eqForm, equipmentCode: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Vị trí *</label>
              <input required value={eqForm.location} onChange={(e) => setEqForm({ ...eqForm, location: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">ID Phòng</label>
            <input type="number" value={eqForm.roomId} onChange={(e) => setEqForm({ ...eqForm, roomId: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm max-w-[140px]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Mô tả</label>
            <textarea rows={2} value={eqForm.description} onChange={(e) => setEqForm({ ...eqForm, description: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEqModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="submit" disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Bạn có chắc muốn xóa mục này?</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
          <button type="button" onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60">{saving ? '...' : 'Xóa'}</button>
        </div>
      </Modal>
    </DashboardShell>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, CheckCircle, LogOut, Filter, Calendar } from 'lucide-react';
import { getAllBookings, createBooking, updateBooking, deleteBooking, searchBookings, updateBookingStatus, assignRoom } from '../services/bookingService';
import { createCustomer } from '../services/customerService';
import { apiFetch } from '../services/api';
import { useLocale } from '../context/LocaleContext';
import { usePermission } from '../hooks/usePermission';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';
import ReceptionistPaymentModal from './ReceptionistPaymentModal';

const STATUS_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán', color: 'bg-amber-100 text-amber-700' },
  { value: 'CONFIRMED', label: 'Chờ check-in', color: 'bg-blue-100 text-blue-700' },
  { value: 'CHECKED_IN', label: 'Đã Check-in', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'CHECKED_OUT', label: 'Đã Check-out', color: 'bg-slate-100 text-slate-700' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
  { value: 'NO_SHOW', label: 'Không đến', color: 'bg-orange-100 text-orange-700' },
];

const EMPTY = {
  fullName: '',
  email: '',
  phone: '',
  idType: '',
  idNumberCard: '',
  nationality: '',
  roomTypeId: '',
  checkInDate: '',
  checkOutDate: '',
  quantity: 1
};

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
  return item.bookingStatus || item.status || 'PENDING_PAYMENT';
}

export default function BookingManager({ readOnly = false }) {
  const { t, locale } = useLocale();
  const { hasPermission, hasAnyPermission } = usePermission();
  
  const canView = hasAnyPermission(['BOOKING_VIEW', 'BOOKING_VIEW_OWN']);
  const canCreate = hasPermission('BOOKING_CREATE');
  const canUpdate = hasPermission('BOOKING_UPDATE');
  const canDelete = hasPermission('BOOKING_DELETE');
  
  const isReceptionistOrAbove = canUpdate || canCreate;

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
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Payment modal state (receptionist)
  const [paymentModal, setPaymentModal] = useState({ open: false, booking: null });

  // States cho tác vụ gán phòng vật lý
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetBooking, setAssignTargetBooking] = useState(null);
  const [assignRoomId, setAssignRoomId] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingAvailableRooms, setLoadingAvailableRooms] = useState(false);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('');
  const [filterRoomId, setFilterRoomId] = useState('');

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const validateField = (fieldName, value) => {
    const isVi = locale === 'vi';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0[0-9]{9}$/;
    const idCardRegex = /^[A-Za-z0-9-]{6,20}$/;
    const cccdRegex = /^\d{12}$/;
    const nameRegex = /^[\p{L}][\p{L}\s'.-]{1,99}$/u;
    const nationalityRegex = /^[\p{L}][\p{L}\s-]{1,59}$/u;
    
    let errorMsg = '';

    if (fieldName === 'fullName') {
      if (!value || !value.trim()) errorMsg = isVi ? 'Vui lòng nhập họ và tên.' : 'Full name is required.';
      else if (!nameRegex.test(value.trim())) errorMsg = isVi ? 'Họ tên chỉ được chứa chữ cái, khoảng trắng và dấu hợp lệ.' : 'Full name contains invalid characters.';
    } else if (fieldName === 'email') {
      if (!value || !value.trim()) errorMsg = isVi ? 'Vui lòng nhập email.' : 'Email is required.';
      else if (!emailRegex.test(value.trim())) errorMsg = isVi ? 'Email không đúng định dạng.' : 'Invalid email format.';
    } else if (fieldName === 'phone') {
      if (!value || !value.trim()) errorMsg = isVi ? 'Vui lòng nhập số điện thoại.' : 'Phone number is required.';
      else if (!phoneRegex.test(value.trim())) errorMsg = isVi ? 'Số điện thoại phải có 10 số và bắt đầu bằng 0.' : 'Phone number must have 10 digits and start with 0.';
    } else if (fieldName === 'idType') {
      if (!value) errorMsg = isVi ? 'Vui lòng chọn loại giấy tờ.' : 'ID type is required.';
    } else if (fieldName === 'idNumberCard') {
      if (!value || !value.trim()) errorMsg = isVi ? 'Vui lòng nhập số giấy tờ.' : 'ID/Passport number is required.';
      else if (form.idType === 'CCCD' && !cccdRegex.test(value.trim())) errorMsg = isVi ? 'CCCD phải gồm đúng 12 chữ số.' : 'CCCD must contain exactly 12 digits.';
      else if (form.idType !== 'CCCD' && !idCardRegex.test(value.trim())) errorMsg = isVi ? 'Số Passport/giấy tờ phải có 6–20 ký tự chữ, số hoặc dấu gạch ngang.' : 'ID/Passport must contain 6–20 letters, numbers, or hyphens.';
    } else if (fieldName === 'nationality') {
      if (!value || !value.trim()) errorMsg = isVi ? 'Vui lòng nhập quốc tịch.' : 'Nationality is required.';
      else if (!nationalityRegex.test(value.trim())) errorMsg = isVi ? 'Quốc tịch chỉ được chứa chữ cái, khoảng trắng hoặc dấu gạch ngang.' : 'Nationality contains invalid characters.';
    } else if (fieldName === 'roomTypeId') {
      if (!value) errorMsg = isVi ? 'Vui lòng chọn hạng phòng.' : 'Please select a room type.';
    } else if (fieldName === 'quantity') {
      if (!value || Number(value) < 1) errorMsg = isVi ? 'Số lượng phòng phải ít nhất là 1.' : 'Quantity must be at least 1.';
    } else if (fieldName === 'checkInDate') {
      if (!value) errorMsg = isVi ? 'Vui lòng chọn ngày nhận phòng.' : 'Please select check-in date.';
    } else if (fieldName === 'checkOutDate') {
      if (!value) errorMsg = isVi ? 'Vui lòng chọn ngày trả phòng.' : 'Please select check-out date.';
    }

    setFormErrors(prev => ({ ...prev, [fieldName]: errorMsg }));
    return errorMsg;
  };

  const validateForm = () => {
    const fieldsToValidate = [
      'fullName', 'email', 'phone', 'idType', 'idNumberCard', 'nationality',
      'roomTypeId', 'quantity', 'checkInDate', 'checkOutDate'
    ];
    const errors = {};
    fieldsToValidate.forEach(field => {
      const err = validateField(field, form[field]);
      if (err) errors[field] = err;
    });

    const isVi = locale === 'vi';
    if (form.checkInDate && form.checkOutDate) {
      const checkInDate = new Date(form.checkInDate);
      const checkOutDate = new Date(form.checkOutDate);
      const todayDate = new Date();
      checkInDate.setHours(0,0,0,0);
      checkOutDate.setHours(0,0,0,0);
      todayDate.setHours(0,0,0,0);

      if (!modal.editing || toInputDateTime(modal.editing.checkInDate) !== form.checkInDate) {
        if (checkInDate < todayDate) {
          errors.checkInDate = isVi ? 'Ngày nhận phòng không được ở quá khứ.' : 'Check-in date cannot be in the past.';
        }
      }
      if (checkOutDate <= checkInDate) {
        errors.checkOutDate = isVi ? 'Ngày trả phòng phải sau ngày nhận phòng.' : 'Check-out date must be after check-in date.';
      }
    }

    setFormErrors(errors);
    setTouchedFields(Object.fromEntries(fieldsToValidate.map(f => [f, true])));
    return Object.keys(errors).length === 0;
  };

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
    if (!canCreate) return notify(t('booking.toast.forbiddenCreate'), 'error');
    setForm(EMPTY);
    setFormErrors({});
    setTouchedFields({});
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    if (!canUpdate) return notify(t('booking.toast.forbiddenEdit'), 'error');
    setForm({
      fullName: item.customer?.fullName || item.customerName || '',
      email: item.customer?.email || '',
      phone: item.customer?.phone || '',
      idType: item.customer?.idType || '',
      idNumberCard: item.customer?.idNumberCard || '',
      nationality: item.customer?.nationality || '',
      roomTypeId: item.roomTypeId || item.roomType?.id || '',
      checkInDate: toInputDateTime(item.checkInDate),
      checkOutDate: toInputDateTime(item.checkOutDate),
      quantity: item.quantity || 1,
    });
    setFormErrors({});
    setTouchedFields({});
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      notify(locale === 'vi' ? 'Vui lòng điền đúng và đầy đủ thông tin.' : 'Please enter correct and complete information.', 'error');
      return;
    }

    setSaving(true);
    try {
      const customerRes = await createCustomer({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        idType: form.idType,
        idNumberCard: form.idNumberCard.trim(),
        nationality: form.nationality.trim(),
      }, locale);
      
      const customerId = customerRes?.data?.id;
      if (!customerId) {
        throw new Error(locale === 'vi' ? 'Không thể tạo hoặc tải thông tin khách hàng.' : 'Could not create/load customer.');
      }

      const payload = {
        customerId: Number(customerId),
        roomTypeId: Number(form.roomTypeId),
        checkInDate: toApiDateTime(form.checkInDate),
        checkOutDate: toApiDateTime(form.checkOutDate),
        quantity: Number(form.quantity),
      };

      if (modal.editing) {
        await updateBooking(modal.editing.id, payload);
        notify(t('booking.toast.updateSuccess'));
      } else {
        await createBooking(payload);
        notify(t('booking.toast.addSuccess'));
      }
      closeModal();
      if (subTab === 'overview') fetchTodayData(); else fetchData(page);
    } catch (err) {
      const errMsg = err.message || '';
      const newErrors = {};
      if (errMsg.toLowerCase().includes('email')) {
        newErrors.email = errMsg;
      } else if (errMsg.toLowerCase().includes('phone') || errMsg.toLowerCase().includes('số điện thoại')) {
        newErrors.phone = errMsg;
      } else if (errMsg.toLowerCase().includes('idcard') || errMsg.toLowerCase().includes('số cccd') || errMsg.toLowerCase().includes('giấy tờ') || errMsg.toLowerCase().includes('passport')) {
        newErrors.idNumberCard = errMsg;
      } else {
        notify(err.status === 403 ? t('booking.toast.forbidden') : (errMsg || t('booking.toast.loadError')), 'error');
      }
      
      if (Object.keys(newErrors).length > 0) {
        setFormErrors(prev => ({ ...prev, ...newErrors }));
        setTouchedFields(prev => ({ ...prev, ...Object.fromEntries(Object.keys(newErrors).map(k => [k, true])) }));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!canDelete) return notify(t('booking.toast.forbiddenDelete'), 'error');
    try {
      await deleteBooking(item.id);
      notify(t('booking.toast.deleteSuccess'));
      if (subTab === 'overview') fetchTodayData(); else fetchData(page);
    } catch (e) {
      notify(e.status === 403 ? t('booking.toast.forbiddenDelete') : e.message, 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const openAssignRoom = async (item) => {
    setAssignTargetBooking(item);
    setAssignRoomId('');
    setAvailableRooms([]);
    setAssignModalOpen(true);
    setLoadingAvailableRooms(true);
    try {
      const targetRoomTypeId = item.roomTypeId || item.roomType?.id;
      const res = await apiFetch(`/rooms?roomTypeId=${targetRoomTypeId}&status=AVAILABLE&size=200`);
      setAvailableRooms(res?.data?.content ?? []);
    } catch (err) {
      notify(err.message || 'Lỗi tải danh sách phòng khả dụng', 'error');
    } finally {
      setLoadingAvailableRooms(false);
    }
  };

  const handleAssignRoomSubmit = async (e) => {
    e.preventDefault();
    if (!assignRoomId) return notify('Vui lòng chọn phòng', 'error');
    setSaving(true);
    try {
      await assignRoom(assignTargetBooking.id, { roomId: Number(assignRoomId) });
      notify('Gán phòng thành công!');
      setAssignModalOpen(false);
      if (subTab === 'overview') fetchTodayData(); else fetchData(page);
    } catch (err) {
      notify(err.message || 'Lỗi gán phòng', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (item, newStatus) => {
    const statusText = t(`booking.status.${newStatus}`) || newStatus;
    if (!window.confirm(t('booking.toast.statusConfirm', { status: statusText }).replace('{status}', statusText))) return;
    try {
      await updateBookingStatus(item.id, { status: newStatus });
      notify(t('booking.toast.statusSuccess') || 'Cập nhật trạng thái thành công!');
      if (subTab === 'overview') fetchTodayData(); else fetchData(page);
    } catch (err) {
      notify(err.message || t('booking.toast.loadError'), 'error');
    }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  const renderStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${opt.color}`}>{t(`booking.status.${opt.value}`)}</span>;
  };

  const rows = items.map(item => {
    const status = getBookingStatus(item);
    return (
      <tr key={item.id} className="hover:bg-stone-50">
        <td className="px-4 py-3 font-mono text-xs font-bold">#{item.id}</td>
        <td className="px-4 py-3 text-sm font-semibold">{item.customerName || item.customer?.fullName || `${t('booking.filters.customer')} #${item.customerId}`}</td>
        <td className="px-4 py-3 text-xs text-slate-500">
          <div>{item.roomTypeName || item.roomType?.typeName || t('booking.filters.roomType')}</div>
          {item.roomNumber && (
            <div className="mt-1">
              <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                Phòng: {item.roomNumber}
              </span>
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-center">{item.quantity}</td>
        <td className="px-4 py-3 text-xs">{formatDate(item.checkInDate)}</td>
        <td className="px-4 py-3 text-xs">{formatDate(item.checkOutDate)}</td>
        <td className="px-4 py-3">{renderStatusBadge(status)}</td>
        <td className="px-4 py-3 text-[#bfa15f] font-bold text-xs">
          {item.totalPrice != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.totalPrice) : '-'}
        </td>
        {!readOnly && isReceptionistOrAbove && (
          <td className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {status === 'PENDING_PAYMENT' && (
                <>
                  <button
                    onClick={() => setPaymentModal({ open: true, booking: item })}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors shadow-sm"
                  >
                    💳 Thanh toán
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item, 'CANCELLED')}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}
              {status === 'CONFIRMED' && (
                <>
                  {!item.roomId ? (
                    <button
                      onClick={() => openAssignRoom(item)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded text-xs font-bold transition-colors"
                    >
                      Gán phòng
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(item, 'CHECKED_IN')}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-bold transition-colors"
                    >
                      Check-in
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(item, 'CANCELLED')}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}
              {status === 'CHECKED_IN' && (
                <button
                  onClick={() => handleUpdateStatus(item, 'CHECKED_OUT')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2 py-1 rounded text-xs font-bold transition-colors"
                >
                  Check-out
                </button>
              )}
              {['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(status) && (
                <span className="text-xs text-slate-400 font-medium italic">Không có tác vụ</span>
              )}
            </div>
          </td>
        )}
        {!readOnly && isReceptionistOrAbove && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Chỉnh sửa"><Edit2 size={15} /></button>
              {deleteConfirmId === item.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(item)} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-600 transition-colors">
                    {t('booking.filters.search') ? 'Xác nhận' : 'Confirm'}
                  </button>
                  <button onClick={() => setDeleteConfirmId(null)} className="border border-stone-300 bg-white px-2 py-1 rounded text-xs font-medium text-slate-600 hover:bg-stone-100 transition-colors">
                    {t('booking.filters.clear') ? 'Hủy' : 'Cancel'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirmId(item.id)} className="text-red-500 hover:text-red-700" title="Xóa"><Trash2 size={15} /></button>
              )}
            </div>
          </td>
        )}
      </tr>
    );
  });

  const cols = [
    t('booking.columns.id'),
    t('booking.columns.customer'),
    t('booking.columns.roomType'),
    t('booking.columns.quantity'),
    t('booking.columns.checkIn'),
    t('booking.columns.checkOut'),
    t('booking.columns.status'),
    t('booking.columns.totalPrice'),
    ...(!readOnly && isReceptionistOrAbove ? ['Quy trình nhanh', t('booking.columns.actions')] : [])
  ];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex border-b border-stone-200 mb-6 gap-6">
        <button onClick={() => setSubTab('overview')} className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${subTab === 'overview' ? 'border-b-2 border-[#bfa15f] text-[#bfa15f]' : 'text-slate-500 hover:text-slate-800'}`}>
          <Calendar size={16} /> {t('booking.tabs.today')}
        </button>
        <button onClick={() => setSubTab('search')} className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${subTab === 'search' ? 'border-b-2 border-[#bfa15f] text-[#bfa15f]' : 'text-slate-500 hover:text-slate-800'}`}>
          <Filter size={16} /> {t('booking.tabs.filter')}
        </button>
        <button onClick={() => setSubTab('all')} className={`pb-3 text-sm font-bold flex items-center gap-1.5 transition-colors ${subTab === 'all' ? 'border-b-2 border-[#bfa15f] text-[#bfa15f]' : 'text-slate-500 hover:text-slate-800'}`}>
          {t('booking.tabs.all')}
        </button>
      </div>

      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <CheckCircle size={18} className="text-emerald-500" /> {t('booking.overview.checkInToday', { count: todayCheckIns.length }).replace('{count}', todayCheckIns.length)}
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {todayCheckIns.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t('booking.overview.noCheckIn')}</p>
              ) : todayCheckIns.map(item => (
                <div key={item.id} className="p-3 bg-stone-50 rounded border hover:shadow-sm transition-shadow">
                  <p className="text-sm font-semibold">{item.customerName || `${t('booking.filters.customer')} #${item.customerId}`}</p>
                  <p className="text-xs text-slate-500">{item.roomTypeName} - SL: <span className="font-bold">{item.quantity}</span></p>
                  <p className="text-xs text-slate-400">{formatDate(item.checkInDate)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <LogOut size={18} className="text-blue-500" /> {t('booking.overview.checkOutToday', { count: todayCheckOuts.length }).replace('{count}', todayCheckOuts.length)}
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {todayCheckOuts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">{t('booking.overview.noCheckOut')}</p>
              ) : todayCheckOuts.map(item => (
                <div key={item.id} className="p-3 bg-stone-50 rounded border hover:shadow-sm transition-shadow">
                  <p className="text-sm font-semibold">{item.customerName || `${t('booking.filters.customer')} #${item.customerId}`}</p>
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
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t('booking.filters.status')}</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">{t('booking.filters.all')}</option>
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(`booking.status.${opt.value}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t('booking.filters.customer')}</label>
              <select value={filterCustomerId} onChange={e => setFilterCustomerId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">{t('booking.filters.all')}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t('booking.filters.roomType')}</label>
              <select value={filterRoomTypeId} onChange={e => setFilterRoomTypeId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">{t('booking.filters.all')}</option>
                {roomTypes.map(r => <option key={r.id} value={r.id}>{r.typeName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t('booking.filters.roomNumber')}</label>
              <select value={filterRoomId} onChange={e => setFilterRoomId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">{t('booking.filters.all')}</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => { setFilterStatus(''); setFilterCustomerId(''); setFilterRoomTypeId(''); setFilterRoomId(''); }} className="px-4 py-2 border rounded text-sm hover:bg-stone-100">{t('booking.filters.clear')}</button>
            <button onClick={() => fetchData(0)} className="px-5 py-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded text-sm font-semibold shadow">{t('booking.filters.search')}</button>
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
                <Plus size={16} /> {t('booking.modal.save')}
              </button>
            )}
          </div>
          <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modal.open} title={modal.editing ? t('booking.modal.editTitle') : t('booking.modal.addTitle')} onClose={closeModal} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Customer Info Section */}
          <div className="border-b border-stone-200 pb-4 mb-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              {locale === 'vi' ? 'Thông tin khách hàng' : 'Customer Information'}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{locale === 'vi' ? 'Họ và tên khách hàng *' : 'Customer Full Name *'}</label>
                <input
                  required
                  type="text"
                  value={form.fullName || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, fullName: e.target.value }));
                    if (touchedFields.fullName) validateField('fullName', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, fullName: true }));
                    validateField('fullName', form.fullName);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.fullName && formErrors.fullName
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.fullName && formErrors.fullName && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.fullName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, email: e.target.value }));
                    if (touchedFields.email) validateField('email', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, email: true }));
                    validateField('email', form.email);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.email && formErrors.email
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.email && formErrors.email && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{locale === 'vi' ? 'Số điện thoại *' : 'Phone Number *'}</label>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  value={form.phone || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, phone: e.target.value }));
                    if (touchedFields.phone) validateField('phone', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, phone: true }));
                    validateField('phone', form.phone);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.phone && formErrors.phone
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.phone && formErrors.phone && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{locale === 'vi' ? 'Loại giấy tờ *' : 'ID Type *'}</label>
                <select
                  required
                  value={form.idType || ''}
                  onChange={e => {
                    const newIdType = e.target.value;
                    setForm(f => {
                      const updated = { ...f, idType: newIdType };
                      if (f.idNumberCard) {
                        setTimeout(() => validateField('idNumberCard', f.idNumberCard), 0);
                      }
                      return updated;
                    });
                    if (touchedFields.idType) validateField('idType', newIdType);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, idType: true }));
                    validateField('idType', form.idType);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none bg-white ${
                    touchedFields.idType && formErrors.idType
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                >
                  <option value="">{locale === 'vi' ? '-- Chọn loại giấy tờ --' : '-- Select ID type --'}</option>
                  <option value="CCCD">CCCD</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="OTHER">Other</option>
                </select>
                {touchedFields.idType && formErrors.idType && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.idType}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{locale === 'vi' ? 'Số giấy tờ *' : 'ID/Passport Number *'}</label>
                <input
                  required
                  type="text"
                  maxLength={form.idType === 'CCCD' ? 12 : 20}
                  value={form.idNumberCard || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, idNumberCard: e.target.value }));
                    if (touchedFields.idNumberCard) validateField('idNumberCard', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, idNumberCard: true }));
                    validateField('idNumberCard', form.idNumberCard);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.idNumberCard && formErrors.idNumberCard
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.idNumberCard && formErrors.idNumberCard && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.idNumberCard}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{locale === 'vi' ? 'Quốc tịch *' : 'Nationality *'}</label>
                <input
                  required
                  type="text"
                  value={form.nationality || ''}
                  onChange={e => {
                    setForm(f => ({ ...f, nationality: e.target.value }));
                    if (touchedFields.nationality) validateField('nationality', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, nationality: true }));
                    validateField('nationality', form.nationality);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.nationality && formErrors.nationality
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.nationality && formErrors.nationality && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.nationality}</p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-1">
              {locale === 'vi' ? 'Thông tin đặt phòng' : 'Booking Information'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('booking.modal.roomType')} *</label>
                <select
                  required
                  value={form.roomTypeId}
                  onChange={e => {
                    setForm(f => ({ ...f, roomTypeId: e.target.value }));
                    if (touchedFields.roomTypeId) validateField('roomTypeId', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, roomTypeId: true }));
                    validateField('roomTypeId', form.roomTypeId);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none bg-white ${
                    touchedFields.roomTypeId && formErrors.roomTypeId
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                >
                  <option value="">{t('booking.modal.selectRoomType')}</option>
                  {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.typeName}</option>)}
                </select>
                {touchedFields.roomTypeId && formErrors.roomTypeId && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.roomTypeId}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('booking.modal.quantity')} *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => {
                    setForm(f => ({ ...f, quantity: e.target.value }));
                    if (touchedFields.quantity) validateField('quantity', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, quantity: true }));
                    validateField('quantity', form.quantity);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.quantity && formErrors.quantity
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.quantity && formErrors.quantity && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.quantity}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('booking.modal.checkIn')} *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.checkInDate}
                  onChange={e => {
                    setForm(f => ({ ...f, checkInDate: e.target.value }));
                    if (touchedFields.checkInDate) validateField('checkInDate', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, checkInDate: true }));
                    validateField('checkInDate', form.checkInDate);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.checkInDate && formErrors.checkInDate
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.checkInDate && formErrors.checkInDate && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.checkInDate}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('booking.modal.checkOut')} *</label>
                <input
                  required
                  type="datetime-local"
                  value={form.checkOutDate}
                  onChange={e => {
                    setForm(f => ({ ...f, checkOutDate: e.target.value }));
                    if (touchedFields.checkOutDate) validateField('checkOutDate', e.target.value);
                  }}
                  onBlur={() => {
                    setTouchedFields(t => ({ ...t, checkOutDate: true }));
                    validateField('checkOutDate', form.checkOutDate);
                  }}
                  className={`w-full border rounded px-3 py-2 text-sm outline-none ${
                    touchedFields.checkOutDate && formErrors.checkOutDate
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-stone-300 focus:border-[#bfa15f]'
                  }`}
                />
                {touchedFields.checkOutDate && formErrors.checkOutDate && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.checkOutDate}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t('booking.modal.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? t('booking.modal.saving') : modal.editing ? t('booking.modal.update') : t('booking.modal.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal gán phòng vật lý */}
      <Modal
        open={assignModalOpen}
        title={`Gán phòng vật lý - Đơn #${assignTargetBooking?.id}`}
        onClose={() => setAssignModalOpen(false)}
        size="md"
      >
        <form onSubmit={handleAssignRoomSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Loại phòng yêu cầu
            </label>
            <input
              type="text"
              readOnly
              value={assignTargetBooking?.roomTypeName || ''}
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm bg-stone-50 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
              Chọn phòng vật lý khả dụng *
            </label>
            {loadingAvailableRooms ? (
              <div className="text-sm text-slate-500 py-2">Đang tải phòng trống...</div>
            ) : availableRooms.length === 0 ? (
              <div className="text-sm text-red-500 py-2 font-bold">
                Không có phòng trống nào thuộc loại phòng này!
              </div>
            ) : (
              <select
                required
                value={assignRoomId}
                onChange={(e) => setAssignRoomId(e.target.value)}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
              >
                <option value="">-- Chọn phòng vật lý --</option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.roomNumber} (Tầng {r.floorNumber})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || availableRooms.length === 0}
              className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60"
            >
              {saving ? 'Đang gán...' : 'Xác nhận gán phòng'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receptionist Payment Modal */}
      <ReceptionistPaymentModal
        open={paymentModal.open}
        booking={paymentModal.booking}
        onClose={() => setPaymentModal({ open: false, booking: null })}
        onSuccess={() => {
          notify(locale === 'vi' ? 'Thanh toán thành công! Đơn đã chuyển sang chờ check-in.' : 'Payment successful! Booking moved to pending check-in.');
          if (subTab === 'overview') fetchTodayData(); else fetchData(page);
        }}
      />
    </div>
  );
}

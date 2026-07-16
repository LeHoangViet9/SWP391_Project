import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllBookings, createBooking, updateBooking, searchBookings, updateBookingStatus } from '../services/bookingService';
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
  const isVi = locale === 'vi';
  const { hasPermission, hasAnyPermission } = usePermission();
  
  const canView = hasAnyPermission(['BOOKING_VIEW', 'BOOKING_VIEW_OWN']);
  const canCreate = hasPermission('BOOKING_CREATE');
  const canUpdate = hasPermission('BOOKING_UPDATE');
  
  const isReceptionistOrAbove = canUpdate || canCreate;

  const [items, setItems] = useState([]);
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

  const [formErrors, setFormErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Payment modal state (receptionist)
  const [paymentModal, setPaymentModal] = useState({ open: false, booking: null });

  // Confirmation modal state for booking cancellation.
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    booking: null,
    reason: 'Khách thay đổi kế hoạch',
  });

  const openCancelConfirm = (item) => setConfirmModal({ open: true, type: 'CANCEL', booking: item, reason: 'Khách thay đổi kế hoạch' });
  const handleExecuteConfirm = async () => {
    const { type, booking } = confirmModal;
    if (!booking) return;
    setSaving(true);
    try {
      if (type === 'CANCEL') {
        await updateBookingStatus(booking.id, { status: 'CANCELLED' });
        notify(locale === 'vi' ? `Hủy thành công đơn đặt phòng #${booking.id}` : `Cancelled booking #${booking.id} successfully`);
      }
      setConfirmModal({ open: false, type: null, booking: null, reason: 'Khách thay đổi kế hoạch' });
      fetchData(page);
    } catch (err) {
      notify(err.message || (locale === 'vi' ? 'Lỗi thao tác, vui lòng thử lại' : 'Action failed, please try again'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('');
  const [filterRoomId, setFilterRoomId] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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
      const hasServerFilters = filterStatus || filterCustomerId || filterRoomTypeId || filterRoomId;
      if (hasServerFilters) {
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
  }, [filterStatus, filterCustomerId, filterRoomTypeId, filterRoomId, page]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

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
      fetchData(page);
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

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '-';

  const renderStatusBadge = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${opt.color}`}>{t(`booking.status.${opt.value}`)}</span>;
  };

  const getIsoDateString = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.substring(0, 10);
    if (Array.isArray(value)) {
      const [y, m, d] = value;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    try {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString().substring(0, 10);
      }
    } catch (e) {}
    return String(value).substring(0, 10);
  };

  const filteredItems = items.filter(item => {
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      const customerName = (item.customerName || item.customer?.fullName || '').toLowerCase();
      const phone = (item.customerPhone || item.customer?.phone || '').toLowerCase();
      const roomType = (item.roomTypeName || item.roomType?.typeName || '').toLowerCase();
      const bookingId = String(item.id).toLowerCase();
      const roomNumber = String(item.roomNumber || '').toLowerCase();

      const matchesKeyword = bookingId.includes(q) || customerName.includes(q) || phone.includes(q) || roomType.includes(q) || roomNumber.includes(q);
      if (!matchesKeyword) return false;
    }

    if (filterStartDate || filterEndDate) {
      const dateStr = getIsoDateString(item.checkInDate);
      if (dateStr) {
        if (filterStartDate && dateStr < filterStartDate) return false;
        if (filterEndDate && dateStr > filterEndDate) return false;
      }
    }

    return true;
  });

  const rows = filteredItems.map((item) => {
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
                    Thanh toán
                  </button>
                  <button
                    onClick={() => openCancelConfirm(item)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}
              {status === 'CONFIRMED' && (
                <>
                  <button
                    onClick={() => openCancelConfirm(item)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold transition-colors"
                  >
                    Hủy đơn
                  </button>
                </>
              )}
              <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700 p-1" title="Chỉnh sửa">
                <Edit2 size={15} />
              </button>
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
    ...(!readOnly && isReceptionistOrAbove ? [t('booking.columns.actions')] : [])
  ];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100" title={isVi ? 'Làm mới' : 'Refresh'}>
            <RefreshCw size={14} />
          </button>
          {!readOnly && isReceptionistOrAbove && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow">
              <Plus size={16} /> {t('booking.modal.save')}
            </button>
          )}
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200 shadow-xs">
            {/* Từ khóa tìm kiếm */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">{isVi ? 'Từ khóa tìm kiếm' : 'Search Keyword'}</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  placeholder={isVi ? 'Mã đơn (#ID), Tên khách, Số ĐT, Số phòng...' : 'Booking ID, Customer Name, Phone, Room #...'}
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]"
                />
                {searchKeyword && (
                  <button onClick={() => setSearchKeyword('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
                )}
              </div>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">{t('booking.filters.status')}</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">{t('booking.filters.all')}</option>
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(`booking.status.${opt.value}`)}</option>)}
              </select>
            </div>

            {/* Hạng phòng */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">{t('booking.filters.roomType')}</label>
              <select value={filterRoomTypeId} onChange={e => setFilterRoomTypeId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">{t('booking.filters.all')}</option>
                {roomTypes.map(r => <option key={r.id} value={r.id}>{r.typeName}</option>)}
              </select>
            </div>



            {/* Số phòng */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">{t('booking.filters.roomNumber')}</label>
              <select value={filterRoomId} onChange={e => setFilterRoomId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]">
                <option value="">{t('booking.filters.all')}</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
              </select>
            </div>

            {/* Ngày Check-in từ ngày */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">{isVi ? 'Check-in từ ngày' : 'Check-in From'}</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]"
              />
            </div>

            {/* Ngày Check-in đến ngày */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">{isVi ? 'Check-in đến ngày' : 'Check-in To'}</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#bfa15f]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => { setFilterStatus(''); setFilterCustomerId(''); setFilterRoomTypeId(''); setFilterRoomId(''); setSearchKeyword(''); setFilterStartDate(''); setFilterEndDate(''); setPage(0); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-stone-100 font-semibold">{t('booking.filters.clear')}</button>
            <button onClick={() => fetchData(0)} className="px-5 py-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded-lg text-sm font-semibold shadow">{t('booking.filters.search')}</button>
          </div>

          <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

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
                  min={localDateTime(new Date()).substring(0, 16)}
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
                  min={form.checkInDate || localDateTime(new Date()).substring(0, 16)}
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

      {/* Receptionist Payment Modal */}
      <ReceptionistPaymentModal
        open={paymentModal.open}
        booking={paymentModal.booking}
        onClose={() => setPaymentModal({ open: false, booking: null })}
        onSuccess={() => {
          notify(locale === 'vi' ? 'Thanh toán thành công! Đơn đã chuyển sang chờ check-in.' : 'Payment successful! Booking moved to pending check-in.');
          fetchData(page);
        }}
      />

      {/* Action Confirmation Modal (Hủy đơn) */}
      <Modal
        open={confirmModal.open}
        title={
          `Xác Nhận Hủy Đơn Đặt Phòng #${confirmModal.booking?.id}`
        }
        onClose={() => setConfirmModal({ open: false, type: null, booking: null, reason: 'Khách thay đổi kế hoạch' })}
        size="md"
      >
        {confirmModal.booking && (
          <div className="space-y-4">
            {confirmModal.type === 'CANCEL' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Xác nhận hủy đơn đặt phòng?</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Đơn đặt phòng sẽ chuyển sang trạng thái <strong>ĐÃ HỦY</strong> và phòng sẽ ngay lập tức được giải phóng trên hệ thống.
                  </p>
                </div>
              </div>
            )}

            {/* Booking Overview Details */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-slate-500">Mã đơn:</span>
                <span className="font-mono font-bold text-slate-800">#{confirmModal.booking.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-semibold text-slate-800">
                  {confirmModal.booking.customerName || confirmModal.booking.customer?.fullName || 'Khách lẻ'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono font-medium text-slate-700">
                  {confirmModal.booking.customerPhone || confirmModal.booking.customer?.phone || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-slate-500">Loại phòng:</span>
                <span className="font-semibold text-slate-800">
                  {confirmModal.booking.roomTypeName || confirmModal.booking.roomType?.typeName}
                  {confirmModal.booking.roomNumber && ` (Phòng: ${confirmModal.booking.roomNumber})`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-slate-500">Thời gian lưu trú:</span>
                <span className="font-medium text-slate-700">
                  {formatDate(confirmModal.booking.checkInDate)} - {formatDate(confirmModal.booking.checkOutDate)}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-1 text-sm font-bold">
                <span className="text-slate-700">Tổng tiền đơn:</span>
                <span className="text-[#bfa15f]">
                  {confirmModal.booking.totalPrice != null
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(confirmModal.booking.totalPrice)
                    : '-'}
                </span>
              </div>
            </div>

            {/* Optional Cancellation Reason input */}
            {confirmModal.type === 'CANCEL' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do hủy phòng:</label>
                <select
                  value={confirmModal.reason}
                  onChange={(e) => setConfirmModal((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                >
                  <option value="Khách thay đổi kế hoạch">Khách thay đổi kế hoạch chuyến đi</option>
                  <option value="Khách đặt nhầm ngày / loại phòng">Khách đặt nhầm ngày / loại phòng</option>
                  <option value="Khách không đến (No-show)">Khách không đến (No-show)</option>
                  <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, type: null, booking: null, reason: 'Khách thay đổi kế hoạch' })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                disabled={saving}
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleExecuteConfirm}
                disabled={saving}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow transition-all flex items-center gap-1.5 ${
                  confirmModal.type === 'CANCEL'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  'Xác Nhận Hủy Đơn'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BedDouble, ClipboardCheck, RefreshCw, Search } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';
import { searchBookings } from '../services/bookingService';
import { getAvailableRoomsForCheckIn, processCheckIn } from '../services/checkInService';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function formatCurrency(value) {
  if (value == null) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

export default function CheckInManager() {
  const { hasPermission } = usePermission();
  const canProcessCheckIn = hasPermission('CHECKIN_PROCESS');
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter] = useState('PENDING_CHECK_IN');
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);
  const [guestInfoConfirmed, setGuestInfoConfirmed] = useState(false);
  const [guestReviewForm, setGuestReviewForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    idType: 'CCCD',
    idNumberCard: '',
    nationality: '',
  });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast((current) => ({ ...current, message: '' }));

  const fetchBookings = useCallback(async (targetPage = page, status = statusFilter) => {
    setLoading(true);
    try {
      const res = await searchBookings({ status, page: targetPage, size: 10 });
      setBookings(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (err) {
      notify(err.message || 'Không thể tải danh sách đặt phòng chờ check-in.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchBookings(page);
  }, [fetchBookings, page]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const filteredBookings = useMemo(() => {
    const q = normalizeText(keyword);
    if (!q) return bookings;
    return bookings.filter((booking) => {
      return [
        booking.id,
        booking.customerName,
        booking.guestFullName,
        booking.guestPhone,
        booking.guestIdNumberCard,
        booking.roomTypeName,
        booking.roomNumber,
      ].some((value) => normalizeText(value).includes(q));
    });
  }, [bookings, keyword]);

  const openCheckInModal = async (booking) => {
    setSelectedBooking(booking);
    setSelectedRoomId(booking.roomId ? String(booking.roomId) : '');
    setAvailableRooms([]);
    setCheckInResult(null);
    setGuestInfoConfirmed(false);
    setGuestReviewForm({
      fullName: booking.guestFullName || booking.customerName || '',
      email: booking.guestEmail || '',
      phone: booking.guestPhone || '',
      idType: booking.guestIdType || 'CCCD',
      idNumberCard: booking.guestIdNumberCard || '',
      nationality: booking.guestNationality || '',
    });
    setModalOpen(true);
    setLoadingRooms(true);

    try {
      const res = await getAvailableRoomsForCheckIn(booking.id);
      setAvailableRooms(res?.data ?? []);
    } catch (err) {
      notify(err.message || 'Không thể tải danh sách phòng trống.', 'error');
    } finally {
      setLoadingRooms(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSelectedBooking(null);
    setSelectedRoomId('');
    setAvailableRooms([]);
    setCheckInResult(null);
    setGuestInfoConfirmed(false);
  };

  const handleCheckIn = async (event) => {
    event.preventDefault();
    if (!selectedBooking?.id) return;

    setSaving(true);
    try {
      const payload = {
        bookingId: selectedBooking.id,
        roomId: selectedRoomId ? Number(selectedRoomId) : null,
        guestInfoConfirmed,
        guestFullName: guestReviewForm.fullName,
        guestEmail: guestReviewForm.email,
        guestPhone: guestReviewForm.phone,
        guestIdType: guestReviewForm.idType,
        guestIdNumberCard: guestReviewForm.idNumberCard,
        guestNationality: guestReviewForm.nationality,
      };
      const res = await processCheckIn(payload);
      setCheckInResult(res?.data ?? null);
      notify(res?.data?.message || 'Check-in thành công.');
      await fetchBookings(0);
      setPage(0);
    } catch (err) {
      const message = err.status === 403
        ? 'Bạn chưa có quyền CHECKIN_PROCESS. Vui lòng phân quyền lại và đăng nhập lại.'
        : err.status === 409
          ? (err.message || 'Booking/phòng chưa đủ điều kiện check-in.')
          : err.status === 500
            ? 'Backend đang lỗi khi xử lý check-in. Hãy xem console backend để lấy stacktrace.'
            : (err.message || 'Check-in thất bại.');
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const rows = filteredBookings.map((booking) => (
    <tr key={booking.id} className="hover:bg-stone-50">
      <td className="px-4 py-3 font-mono text-xs font-bold">#{booking.id}</td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">{booking.customerName || '-'}</p>
        {booking.bookingForOther && (
          <p className="mt-1 inline-flex rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
            Đặt hộ: {booking.guestFullName || '-'}
          </p>
        )}
        <p className="text-xs text-slate-400">Khách hàng #{booking.customerId}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold">{booking.roomTypeName || '-'}</p>
        <p className="text-xs text-slate-400">Số lượng: {booking.quantity || 1}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(booking.checkInDate)}</td>
      <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(booking.checkOutDate)}</td>
      <td className="px-4 py-3 text-sm font-bold text-[#bfa15f]">{formatCurrency(booking.totalPrice)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
          booking.bookingStatus === 'PENDING_PAYMENT'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {booking.bookingStatus === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : 'Chờ check-in'}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => openCheckInModal(booking)}
          disabled={!canProcessCheckIn}
          title={!canProcessCheckIn ? 'Cần quyền CHECKIN_PROCESS để check-in' : undefined}
          className="inline-flex items-center gap-1.5 rounded bg-[#bfa15f] px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-[#a3854a]"
        >
          <ClipboardCheck size={14} />
          Check-in
        </button>
      </td>
    </tr>
  ));

  return (
    <div className="space-y-5">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Tiếp nhận khách nhận phòng</h2>
          <p className="mt-1 text-sm text-slate-500">
            Xử lý các đơn đã thanh toán và đang chờ check-in; không còn bước xác nhận thủ công.
          </p>
        </div>
        <button
          onClick={() => fetchBookings(0)}
          className="inline-flex items-center justify-center gap-2 rounded border border-stone-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-stone-50"
        >
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Tìm booking</span>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Nhập mã đơn, tên khách, hạng phòng..."
              className="w-full rounded border border-stone-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
        </label>
        <div className="rounded border border-emerald-100 bg-emerald-50 px-4 py-2">
          <p className="text-xs font-bold uppercase text-emerald-700">
            {statusFilter === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : 'Chờ check-in'}
          </p>
          <p className="text-lg font-bold text-emerald-800">{filteredBookings.length}</p>
        </div>
      </div>

      <DataTable
        columns={['Mã đơn', 'Khách hàng', 'Hạng phòng', 'Ngày nhận', 'Ngày trả', 'Tổng tiền', 'Trạng thái', 'Thao tác']}
        rows={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText={statusFilter === 'PENDING_PAYMENT'
          ? 'Không có đơn đặt phòng chờ thanh toán.'
          : 'Không có đơn đặt phòng chờ check-in.'}
      />

      <Modal
        open={modalOpen}
        title={selectedBooking ? `Check-in đơn #${selectedBooking.id}` : 'Check-in'}
        onClose={closeModal}
        size="lg"
      >
        <form onSubmit={handleCheckIn} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Khách hàng</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{selectedBooking?.customerName || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Hạng phòng</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{selectedBooking?.roomTypeName || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Ngày nhận</p>
              <p className="mt-1 text-sm text-slate-700">{formatDateTime(selectedBooking?.checkInDate)}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Ngày trả</p>
              <p className="mt-1 text-sm text-slate-700">{formatDateTime(selectedBooking?.checkOutDate)}</p>
            </div>
          </div>

          {selectedBooking?.bookingForOther && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-800">Đơn này được đặt hộ người khác</p>
              <p className="mt-1 text-xs text-amber-700">
                Kiểm tra giấy tờ và cập nhật đúng thông tin người lưu trú trước khi check-in.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-stone-200 p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-bold text-slate-800">Thông tin người lưu trú</h4>
              {selectedBooking?.bookingForOther && (
                <span className="text-xs font-bold uppercase text-amber-700">Cần xác minh</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Họ tên</span>
                <input
                  value={guestReviewForm.fullName}
                  onChange={(event) => setGuestReviewForm({ ...guestReviewForm, fullName: event.target.value })}
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Email</span>
                <input
                  value={guestReviewForm.email}
                  onChange={(event) => setGuestReviewForm({ ...guestReviewForm, email: event.target.value })}
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Số điện thoại</span>
                <input
                  value={guestReviewForm.phone}
                  onChange={(event) => setGuestReviewForm({ ...guestReviewForm, phone: event.target.value })}
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Loại giấy tờ</span>
                <select
                  value={guestReviewForm.idType}
                  onChange={(event) => setGuestReviewForm({ ...guestReviewForm, idType: event.target.value })}
                  className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                >
                  <option value="CCCD">CCCD</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Số CCCD/Passport</span>
                <input
                  value={guestReviewForm.idNumberCard}
                  onChange={(event) => setGuestReviewForm({ ...guestReviewForm, idNumberCard: event.target.value })}
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-slate-500">Quốc tịch</span>
                <input
                  value={guestReviewForm.nationality}
                  onChange={(event) => setGuestReviewForm({ ...guestReviewForm, nationality: event.target.value })}
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
                />
              </label>
            </div>
            {selectedBooking?.bookingForOther && (
              <label className="mt-4 flex items-start gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={guestInfoConfirmed}
                  onChange={(event) => setGuestInfoConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#bfa15f]"
                />
                Đã kiểm tra giấy tờ và xác nhận thông tin người lưu trú
              </label>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
              Phòng nhận khách
            </label>
            {loadingRooms ? (
              <div className="rounded border border-stone-200 px-3 py-2 text-sm text-slate-500">
                Đang tải phòng trống...
              </div>
            ) : (
              <select
                value={selectedRoomId}
                onChange={(event) => setSelectedRoomId(event.target.value)}
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#bfa15f]"
              >
                <option value="">Tự động chọn phòng phù hợp</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Phòng {room.roomNumber} - Tầng {room.floorNumber} ({room.roomStatus})
                  </option>
                ))}
              </select>
            )}
            {!loadingRooms && availableRooms.length === 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Không tìm thấy phòng trống phù hợp. Backend vẫn sẽ kiểm tra lại khi xác nhận.
              </p>
            )}
          </div>

          {checkInResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 size={18} />
                <p className="text-sm font-bold">Check-in thành công</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <p><span className="font-semibold">Khách:</span> {checkInResult.customerName}</p>
                <p><span className="font-semibold">Phòng:</span> {checkInResult.roomNumber}</p>
                <p><span className="font-semibold">Trạng thái:</span> {checkInResult.bookingStatus}</p>
                <p><span className="font-semibold">Thời gian:</span> {formatDateTime(checkInResult.checkInTime)}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-stone-50"
            >
              Đóng
            </button>
            {!checkInResult && (
              <button
                type="submit"
                disabled={saving || loadingRooms || !canProcessCheckIn || (selectedBooking?.bookingForOther && !guestInfoConfirmed)}
                title={!canProcessCheckIn ? 'Cần quyền CHECKIN_PROCESS để check-in' : undefined}
                className="inline-flex items-center gap-2 rounded bg-[#bfa15f] px-5 py-2 text-sm font-bold text-white shadow hover:bg-[#a3854a] disabled:opacity-60"
              >
                <BedDouble size={16} />
                {saving ? 'Đang check-in...' : 'Xác nhận check-in'}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

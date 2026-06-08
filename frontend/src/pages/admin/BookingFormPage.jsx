import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  createBooking,
  updateBooking,
  getBookingById,
} from '../../services/bookingService';
import Alert from '../../components/common/Alert';
import {
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
  formatCurrency,
  formatDateTime,
} from '../../utils/format';
import StatusBadge from '../../components/common/StatusBadge';

const emptyForm = {
  customerId: '',
  roomTypeId: '',
  checkInDate: '',
  checkOutDate: '',
  quantity: 1,
};

export default function BookingFormPage() {
  const { id } = useParams();
  const location = useLocation();
  const isEdit = Boolean(id) && id !== 'new';
  const isView = isEdit && !location.pathname.endsWith('/edit');
  const navigate = useNavigate();
  const { locale } = useLocale();

  const [form, setForm] = useState(emptyForm);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await getBookingById(id, locale);
        if (cancelled) return;
        const b = res?.data;
        setBooking(b);
        setForm({
          customerId: String(b.customerId || ''),
          roomTypeId: String(b.roomTypeId || ''),
          checkInDate: toDateTimeLocalValue(b.checkInDate),
          checkOutDate: toDateTimeLocalValue(b.checkOutDate),
          quantity: b.quantity || 1,
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải đặt phòng');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isEdit, locale]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      customerId: Number(form.customerId),
      roomTypeId: Number(form.roomTypeId),
      checkInDate: fromDateTimeLocalValue(form.checkInDate),
      checkOutDate: fromDateTimeLocalValue(form.checkOutDate),
      quantity: Number(form.quantity),
    };
    try {
      if (isEdit) {
        await updateBooking(id, payload, locale);
      } else {
        await createBooking(payload, locale);
      }
      navigate('/admin/bookings');
    } catch (err) {
      setError(err.message || 'Không thể lưu đặt phòng');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">Đang tải...</div>;
  }

  if (isView && booking) {
    return (
      <div className="max-w-2xl">
        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold">Đặt phòng #{booking.id}</h1>
            <StatusBadge status={booking.bookingStatus} />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-400">Khách hàng</dt><dd className="font-medium">{booking.customerName}</dd></div>
            <div><dt className="text-slate-400">Loại phòng</dt><dd className="font-medium">{booking.roomTypeName}</dd></div>
            <div><dt className="text-slate-400">Check-in</dt><dd>{formatDateTime(booking.checkInDate)}</dd></div>
            <div><dt className="text-slate-400">Check-out</dt><dd>{formatDateTime(booking.checkOutDate)}</dd></div>
            <div><dt className="text-slate-400">Số lượng</dt><dd>{booking.quantity}</dd></div>
            <div><dt className="text-slate-400">Giá/đêm</dt><dd>{formatCurrency(booking.pricePerNight)}</dd></div>
            <div><dt className="text-slate-400">Tổng tiền</dt><dd className="font-semibold text-[#bfa15f]">{formatCurrency(booking.totalPrice)}</dd></div>
            <div><dt className="text-slate-400">Ngày tạo</dt><dd>{formatDateTime(booking.createdAt)}</dd></div>
          </dl>
          <Link
            to={`/admin/bookings/${id}/edit`}
            className="inline-flex items-center gap-2 btn-gold px-4 py-2 rounded-lg text-sm"
          >
            <Save size={16} /> Chỉnh sửa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">
        {isEdit ? `Sửa đặt phòng #${id}` : 'Tạo đặt phòng mới'}
      </h1>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              ID Khách hàng *
            </label>
            <input
              type="number"
              required
              value={form.customerId}
              onChange={(e) => handleChange('customerId', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              ID Loại phòng *
            </label>
            <input
              type="number"
              required
              value={form.roomTypeId}
              onChange={(e) => handleChange('roomTypeId', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Check-in *
            </label>
            <input
              type="datetime-local"
              required
              value={form.checkInDate}
              onChange={(e) => handleChange('checkInDate', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Check-out *
            </label>
            <input
              type="datetime-local"
              required
              value={form.checkOutDate}
              onChange={(e) => handleChange('checkOutDate', e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Số lượng phòng *
          </label>
          <input
            type="number"
            min={1}
            required
            value={form.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] max-w-[200px]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 btn-gold px-6 py-2.5 rounded-lg text-sm disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import {
  getBookingById,
  createBooking,
  updateBooking,
} from '../../services/bookingService';
import { getCustomers } from '../../services/customerService';
import { getRoomTypes } from '../../services/roomService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

const EMPTY_FORM = {
  customerId: '',
  roomTypeId: '',
  checkInDate: '',
  checkOutDate: '',
  quantity: 1,
};

export default function BookingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: bookingRes, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id, locale),
    enabled: isEdit,
  });

  const { data: customersRes } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => getCustomers({ size: 200 }, locale),
  });

  const { data: roomTypesRes } = useQuery({
    queryKey: ['room-types-select'],
    queryFn: () => getRoomTypes({ size: 100 }, locale),
  });

  const customers = customersRes?.data?.content || [];
  const roomTypes = roomTypesRes?.data?.content || [];
  const selectedRoomType = roomTypes.find((rt) => String(rt.id) === String(form.roomTypeId));

  useEffect(() => {
    if (bookingRes?.data) {
      const b = bookingRes.data;
      setForm({
        customerId: String(b.customerId),
        roomTypeId: String(b.roomTypeId),
        checkInDate: b.checkInDate?.slice(0, 10) || '',
        checkOutDate: b.checkOutDate?.slice(0, 10) || '',
        quantity: b.quantity || 1,
      });
    }
  }, [bookingRes]);

  const nights =
    form.checkInDate && form.checkOutDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(form.checkOutDate) - new Date(form.checkInDate)) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const estimatedTotal =
    selectedRoomType && nights > 0
      ? selectedRoomType.basePrice * nights * (form.quantity || 1)
      : null;

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? updateBooking(id, payload, locale) : createBooking(payload, locale),
    onSuccess: (res) => {
      showToast(res.message || t('staff.common.saveSuccess'), 'success');
      navigate('/staff/bookings');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      customerId: Number(form.customerId),
      roomTypeId: Number(form.roomTypeId),
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      quantity: Number(form.quantity),
    });
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <Link
        to="/staff/bookings"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} />
        {t('bookingPage.back')}
      </Link>

      <h1 className="font-display text-2xl font-bold text-slate-800 mb-6">
        {isEdit ? t('staff.booking.edit') : t('staff.booking.add')}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('staff.booking.customer')} *
          </label>
          <select
            required
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
          >
            <option value="">{t('staff.booking.selectCustomer')}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} — {c.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('bookingPage.roomType')} *
          </label>
          <select
            required
            value={form.roomTypeId}
            onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
            className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
          >
            <option value="">{t('staff.booking.selectRoomType')}</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.typeName} — {formatCurrency(rt.basePrice, locale)}/{t('bookingPage.nights')}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              {t('booking.checkIn')} *
            </label>
            <input
              type="date"
              required
              value={form.checkInDate}
              onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              {t('booking.checkOut')} *
            </label>
            <input
              type="date"
              required
              min={form.checkInDate}
              value={form.checkOutDate}
              onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            {t('booking.rooms')} *
          </label>
          <input
            type="number"
            required
            min={1}
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
          />
        </div>

        {estimatedTotal != null && (
          <div className="bg-stone-50 rounded-lg p-4 text-sm">
            <p className="text-slate-500">
              {nights} {t('bookingPage.nights')} × {form.quantity} {t('booking.rooms')}
            </p>
            <p className="font-semibold text-lg text-slate-800 mt-1">
              {t('bookingPage.total')}: {formatCurrency(estimatedTotal, locale)}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-gold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {mutation.isPending ? '...' : t('staff.common.save')}
        </button>
      </form>
    </div>
  );
}

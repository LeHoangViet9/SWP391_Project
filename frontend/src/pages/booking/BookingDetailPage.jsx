import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Pencil, LogIn, LogOut, User, CalendarDays, BedDouble,
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getBookingById, updateBooking } from '../../services/bookingService';
import { canManageBookings } from '../../utils/roleAccess';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmModal from '../../components/ui/ConfirmModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';

const STATUS_TIMELINE = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'];

function TimelineStep({ status, currentStatus, t }) {
  const currentIdx = STATUS_TIMELINE.indexOf(currentStatus);
  const stepIdx = STATUS_TIMELINE.indexOf(status);
  const isCompleted = stepIdx <= currentIdx;
  const isCurrent = stepIdx === currentIdx;

  const icons = {
    PENDING: Clock,
    CONFIRMED: CheckCircle,
    CHECKED_IN: LogIn,
    CHECKED_OUT: LogOut,
  };
  const Icon = icons[status] || Clock;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
        isCurrent
          ? 'bg-[#bfa15f] text-white shadow-md'
          : isCompleted
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-stone-100 text-slate-400'
      }`}>
        <Icon size={14} />
      </div>
      <div>
        <p className={`text-sm font-medium ${isCurrent ? 'text-[#bfa15f]' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
          {status.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = user?.roleName;
  const canManage = canManageBookings(role);

  const [confirmAction, setConfirmAction] = useState(null); // 'checkin' | 'checkout'

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => {
      const b = data?.data;
      return updateBooking(id, {
        customerId: b.customerId,
        roomTypeId: b.roomTypeId,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        quantity: b.quantity,
        bookingStatus: newStatus,
      });
    },
    onSuccess: (res) => {
      showToast(res.message || t('staff.common.saveSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      setConfirmAction(null);
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-red-500 p-6">{error.message}</p>;

  const b = data?.data;
  if (!b) return <p className="text-slate-400 p-6">{t('staff.common.noData')}</p>;

  const currentStatus = b.bookingStatus || 'PENDING';
  const canCheckIn = canManage && (currentStatus === 'PENDING' || currentStatus === 'CONFIRMED');
  const canCheckOut = canManage && currentStatus === 'CHECKED_IN';

  const nights =
    b.checkInDate && b.checkOutDate
      ? Math.max(0, Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24)))
      : 0;

  return (
    <div className="animate-fadeInUp">
      <Link
        to="/staff/bookings"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} />
        {t('bookingPage.back')}
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('staff.bookingDetail.title')} #{b.id}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={currentStatus} />
          </div>
        </div>
        <div className="flex gap-2 self-start">
          {canCheckIn && (
            <button
              onClick={() => setConfirmAction('checkin')}
              className="btn-success px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm"
            >
              <LogIn size={16} />
              {t('staff.bookingDetail.checkInBtn')}
            </button>
          )}
          {canCheckOut && (
            <button
              onClick={() => setConfirmAction('checkout')}
              className="btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm"
            >
              <LogOut size={16} />
              {t('staff.bookingDetail.checkOutBtn')}
            </button>
          )}
          {canManage && (
            <Link
              to={`/staff/bookings/${id}/edit`}
              className="btn-outline px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm"
            >
              <Pencil size={14} />
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Main Info ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Info Card */}
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#bfa15f]" />
              {t('staff.bookingDetail.bookingInfo')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">{t('booking.checkIn')}</p>
                <p className="text-sm font-medium">{formatDate(b.checkInDate, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">{t('booking.checkOut')}</p>
                <p className="text-sm font-medium">{formatDate(b.checkOutDate, locale)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">{t('staff.bookingDetail.nights')}</p>
                <p className="text-sm font-medium">{nights} {t('staff.bookingDetail.nights')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">{t('staff.bookingDetail.rooms')}</p>
                <p className="text-sm font-medium">{b.quantity || 1} {t('staff.bookingDetail.rooms')}</p>
              </div>
            </div>
          </div>

          {/* Room Type */}
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BedDouble size={16} className="text-[#bfa15f]" />
              {t('bookingPage.roomType')}
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{b.roomTypeName}</p>
                {b.roomNumber && <p className="text-sm text-slate-400">Phòng: {b.roomNumber}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{t('staff.bookingDetail.unitPrice')}</p>
                <p className="text-lg font-bold text-[#bfa15f]">
                  {formatCurrency(b.totalPrice && nights > 0 ? b.totalPrice / nights / (b.quantity || 1) : 0, locale)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User size={16} className="text-[#bfa15f]" />
              {t('staff.bookingDetail.customerInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400">{t('auth.fullName')}</p>
                <p className="text-sm font-medium">{b.customerName}</p>
              </div>
              {b.customerPhone && (
                <div>
                  <p className="text-xs text-slate-400">{t('auth.phone')}</p>
                  <p className="text-sm">{b.customerPhone}</p>
                </div>
              )}
              {b.customerEmail && (
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm">{b.customerEmail}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Sidebar ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Payment */}
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-[#bfa15f]" />
              {t('staff.bookingDetail.paymentStatus')}
            </h3>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-gradient-gold">
                {formatCurrency(b.totalPrice, locale)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {nights} {t('staff.bookingDetail.nights')} × {b.quantity || 1} {t('staff.bookingDetail.rooms')}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="hms-card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#bfa15f]" />
              {t('staff.bookingDetail.timeline')}
            </h3>
            <div className="space-y-4">
              {STATUS_TIMELINE.map((status, idx) => (
                <div key={status}>
                  <TimelineStep status={status} currentStatus={currentStatus} t={t} />
                  {idx < STATUS_TIMELINE.length - 1 && (
                    <div className="ml-4 h-6 border-l-2 border-stone-200" />
                  )}
                </div>
              ))}
              {currentStatus === 'CANCELLED' && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                    <XCircle size={14} />
                  </div>
                  <p className="text-sm font-medium text-red-600">CANCELLED</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modals */}
      <ConfirmModal
        open={confirmAction === 'checkin'}
        title={t('staff.bookingDetail.checkInBtn')}
        message={t('staff.bookingDetail.confirmCheckin')}
        loading={statusMutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => statusMutation.mutate('CHECKED_IN')}
      />
      <ConfirmModal
        open={confirmAction === 'checkout'}
        title={t('staff.bookingDetail.checkOutBtn')}
        message={t('staff.bookingDetail.confirmCheckout')}
        loading={statusMutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => statusMutation.mutate('CHECKED_OUT')}
      />
    </div>
  );
}

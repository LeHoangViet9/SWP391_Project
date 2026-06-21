import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar, Users, Building2, CreditCard, CheckCircle, ArrowLeft,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { roomTypes as mockRoomTypes } from '../data/mockData';
import { apiFetch } from '../services/api';
import { createBooking } from '../services/bookingService';
import {
  createCustomer,
  getStoredCustomerId,
  saveCustomerId,
  searchCustomerByEmail,
} from '../services/customerService';
import BookingFailureModal from '../components/BookingFailureModal';

const today = () => new Date().toISOString().split('T')[0];
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

function toCheckIn(date) {
  return `${date}T14:00:00`;
}

function toCheckOut(date) {
  return `${date}T12:00:00`;
}

function formatPrice(price, locale) {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

function BookingContent() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [params] = useSearchParams();

  const roomTypeId = params.get('roomTypeId') || '1';
  const [roomType, setRoomType] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [failureModalOpen, setFailureModalOpen] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');

  const [booking, setBooking] = useState({
    checkIn: params.get('checkIn') || today(),
    checkOut: params.get('checkOut') || tomorrow(),
    quantity: Number(params.get('quantity')) || 1,
  });

  const [customerForm, setCustomerForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    idType: 'CCCD',
    idNumberCard: '',
    nationality: locale === 'vi' ? 'Việt Nam' : 'Vietnam',
  });

  // Email dùng để lookup customer phải là email tài khoản đang login (nếu có)
  const lookupEmail = user?.email || customerForm.email;

  useEffect(() => {
    const mock = mockRoomTypes.find((r) => String(r.id) === roomTypeId);
    setRoomType(mock || mockRoomTypes[0]);

    apiFetch(`/room-types/${roomTypeId}`, {}, locale)
      .then((res) => {
        if (res?.data) {
          const rt = res.data;
          setRoomType({
            ...rt,
            basePrice: Number(rt.basePrice),
            imageUrl: mock?.imageUrl || mockRoomTypes[0].imageUrl,
            amenities: mock?.amenities || [],
          });
        }
      })
      .catch(() => {});
  }, [roomTypeId, locale]);

  const [availableRoomsCount, setAvailableRoomsCount] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!booking.checkIn || !booking.checkOut || !roomTypeId) return;

    setCheckingAvailability(true);
    setError('');

    const checkInDateTime = toCheckIn(booking.checkIn);
    const checkOutDateTime = toCheckOut(booking.checkOut);

    apiFetch(`/bookings/check-availability?roomTypeId=${roomTypeId}&checkInDate=${encodeURIComponent(checkInDateTime)}&checkOutDate=${encodeURIComponent(checkOutDateTime)}`, {}, locale)
      .then((res) => {
        if (res && res.data !== undefined) {
          setAvailableRoomsCount(res.data);
          if (res.data < booking.quantity) {
            setError(locale === 'vi'
              ? `Hết phòng! Chỉ còn lại ${res.data} phòng trống của hạng phòng này trong khoảng thời gian đã chọn.`
              : `Sold out! Only ${res.data} rooms left for this room type during the selected dates.`);
          }
        }
      })
      .catch((err) => {
        console.error('Error checking availability:', err);
      })
      .finally(() => {
        setCheckingAvailability(false);
      });
  }, [roomTypeId, booking.checkIn, booking.checkOut, booking.quantity, locale]);

  useEffect(() => {
    if (!user) return;
    if (user.email) {
      searchCustomerByEmail(user.email, locale)
        .then((found) => {
          if (found) {
            saveCustomerId(found.id);
            setCustomerForm({
              fullName: found.fullName || user.fullName || '',
              email: found.email || user.email || '',
              phone: found.phone || user.phone || '',
              idType: found.idType || 'CCCD',
              idNumberCard: found.idNumberCard || '',
              nationality: found.nationality || (locale === 'vi' ? 'Việt Nam' : 'Vietnam'),
            });
          } else {
            setCustomerForm((prev) => ({
              ...prev,
              fullName: user.fullName || prev.fullName,
              email: user.email || prev.email,
              phone: user.phone || prev.phone,
            }));
          }
        })
        .catch(() => {
          setCustomerForm((prev) => ({
            ...prev,
            fullName: user.fullName || prev.fullName,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
          }));
        });
    } else {
      setCustomerForm((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user, locale]);

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const pricePerNight = roomType?.basePrice || 0;
  const totalEstimate = pricePerNight * nights * booking.quantity;

  const ensureCustomerId = async () => {
    // Dùng email tài khoản login để tra cứu/tạo customer profile
    // Đảm bảo lịch sử đặt phòng được liên kết đúng với tài khoản
    const emailToUse = lookupEmail;

    if (emailToUse) {
      try {
        const found = await searchCustomerByEmail(emailToUse, locale);
        if (found?.id) {
          saveCustomerId(found.id);
          return Number(found.id);
        }
      } catch (_) { /* tiếp tục tạo mới */ }
    }

    // Chỉ kiểm tra localStorage nếu KHÔNG có tài khoản đăng nhập
    if (!user) {
      const stored = getStoredCustomerId();
      if (stored) return Number(stored);
    }

    // Tạo mới customer profile
    const res = await createCustomer({
      fullName: customerForm.fullName,
      email: emailToUse || customerForm.email,
      phone: customerForm.phone,
      idType: customerForm.idType,
      idNumberCard: customerForm.idNumberCard,
      nationality: customerForm.nationality,
    }, locale);

    return res.data.id;
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const customerId = await ensureCustomerId();
      const payload = {
        customerId,
        roomTypeId: Number(roomTypeId),
        checkInDate: toCheckIn(booking.checkIn),
        checkOutDate: toCheckOut(booking.checkOut),
        quantity: booking.quantity,
      };

      console.log('[Booking] POST /api/v1/bookings', payload);
      const res = await createBooking(payload, locale);
      setBookingResult(res.data);
      setStep(3);
    } catch (err) {
      const msg = err.message || t('bookingPage.submitFailed');
      setFailureMessage(msg);
      setFailureModalOpen(true);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!roomType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[#bfa15f]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-6">
          <ArrowLeft size={16} />
          {t('bookingPage.backHome')}
        </Link>

        <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">{t('bookingPage.title')}</h1>
        <p className="text-slate-500 mb-8">{t('bookingPage.subtitle')}</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= s ? 'bg-[#bfa15f] text-white' : 'bg-stone-200 text-slate-500'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-[#bfa15f]' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>

        {/* Room summary card */}
        <div className="bg-white border border-stone-200 shadow-lg mb-6 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <img src={roomType.imageUrl} alt={roomType.typeName} className="h-48 md:h-full object-cover" />
            <div className="md:col-span-2 p-6">
              <h2 className="font-display text-xl font-semibold text-slate-800 mb-2">{roomType.typeName}</h2>
              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{roomType.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Users size={14} className="text-[#bfa15f]" />{roomType.maxGuests} {t('rooms.guests')}</span>
                <span className="flex items-center gap-1"><Building2 size={14} className="text-[#bfa15f]" />{booking.quantity} {t('booking.rooms')}</span>
                <span className="font-semibold text-[#bfa15f]">{formatPrice(pricePerNight, locale)}{t('rooms.perNight')}</span>
              </div>
            </div>
          </div>
        </div>

        {error && !failureModalOpen && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-6">{error}</div>
        )}

        {/* Booking Failure Modal */}
        <BookingFailureModal
          open={failureModalOpen}
          errorMessage={failureMessage}
          locale={locale}
          onClose={() => { setFailureModalOpen(false); setError(''); }}
          onRetry={() => { setFailureModalOpen(false); setError(''); handleSubmit(); }}
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
        />

        {/* Step 1: Dates & quantity */}
        {step === 1 && (
          <div className="bg-white border border-stone-200 shadow-lg p-6 space-y-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-[#bfa15f]" />
              {t('bookingPage.stepDates')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('booking.checkIn')}</label>
                <input
                  type="date"
                  value={booking.checkIn}
                  min={today()}
                  onChange={(e) => {
                    const newCheckIn = e.target.value;
                    setBooking((prev) => {
                      const updated = { ...prev, checkIn: newCheckIn };
                      if (!prev.checkOut || prev.checkOut <= newCheckIn) {
                        const nextDay = new Date(newCheckIn);
                        nextDay.setDate(nextDay.getDate() + 1);
                        updated.checkOut = nextDay.toISOString().split('T')[0];
                      }
                      return updated;
                    });
                  }}
                  className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('booking.checkOut')}</label>
                <input
                  type="date"
                  value={booking.checkOut}
                  min={(() => {
                    if (!booking.checkIn) return today();
                    const dt = new Date(booking.checkIn);
                    dt.setDate(dt.getDate() + 1);
                    return dt.toISOString().split('T')[0];
                  })()}
                  onChange={(e) => setBooking({ ...booking, checkOut: e.target.value })}
                  className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('booking.rooms')}</label>
                <input type="number" min={1} max={10} value={booking.quantity} onChange={(e) => setBooking({ ...booking, quantity: Number(e.target.value) })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
              </div>
            </div>
            <div className="bg-stone-50 p-4 flex justify-between items-center">
              <span className="text-slate-600">{nights} {t('bookingPage.nights')} × {booking.quantity} {t('booking.rooms')}</span>
              <span className="text-xl font-bold text-[#bfa15f]">{formatPrice(totalEstimate, locale)}</span>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={checkingAvailability || (availableRoomsCount !== null && availableRoomsCount < booking.quantity)}
              className="w-full btn-gold py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingAvailability
                ? (locale === 'vi' ? 'Đang kiểm tra phòng trống...' : 'Checking availability...')
                : t('bookingPage.continue')}
            </button>
          </div>
        )}

        {/* Step 2: Guest info */}
        {step === 2 && (
          <div className="bg-white border border-stone-200 shadow-lg p-6 space-y-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard size={18} className="text-[#bfa15f]" />
              {t('bookingPage.stepGuest')}
            </h3>
            <p className="text-sm text-slate-500">{t('bookingPage.guestHint')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('auth.fullName')}</label>
                <input type="text" required value={customerForm.fullName} onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">Email</label>
                <input
                  type="email" required
                  value={lookupEmail || customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  readOnly={!!user?.email}
                  className={`w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f] ${user?.email ? 'bg-stone-50 text-slate-500 cursor-not-allowed' : ''}`}
                />
                {user?.email && <p className="text-xs text-slate-400 mt-0.5">{locale === 'vi' ? 'Email tài khoản đăng nhập' : 'Logged-in account email'}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('auth.phone')}</label>
                <input type="tel" required value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.idType')}</label>
                <select value={customerForm.idType} onChange={(e) => setCustomerForm({ ...customerForm, idType: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]">
                  <option value="CCCD">CCCD</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.idNumber')}</label>
                <input type="text" required value={customerForm.idNumberCard} onChange={(e) => setCustomerForm({ ...customerForm, idNumberCard: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.nationality')}</label>
                <input type="text" required value={customerForm.nationality} onChange={(e) => setCustomerForm({ ...customerForm, nationality: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
              </div>
            </div>
            <div className="bg-stone-50 p-4">
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>{roomType.typeName} × {booking.quantity}</span>
                <span>{formatPrice(totalEstimate, locale)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>{t('bookingPage.total')}</span>
                <span className="text-[#bfa15f]">{formatPrice(totalEstimate, locale)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-stone-300 text-slate-600 font-medium hover:border-[#bfa15f] transition-colors">{t('bookingPage.back')}</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-gold py-3 rounded disabled:opacity-60">
                {loading ? '...' : t('bookingPage.confirm')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && bookingResult && (
          <div className="bg-white border border-stone-200 shadow-lg p-8 text-center">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-slate-800 mb-2">{t('bookingPage.successTitle')}</h3>
            <p className="text-slate-500 mb-6">{t('bookingPage.successDesc')}</p>
            <div className="bg-stone-50 p-6 text-left space-y-2 text-sm mb-6">
              <p><span className="text-slate-500">{t('bookingPage.bookingId')}:</span> <strong>#{bookingResult.id}</strong></p>
              <p><span className="text-slate-500">{t('bookingPage.roomType')}:</span> <strong>{bookingResult.roomTypeName}</strong></p>
              <p><span className="text-slate-500">{t('booking.checkIn')}:</span> <strong>{bookingResult.checkInDate?.split('T')[0]}</strong></p>
              <p><span className="text-slate-500">{t('booking.checkOut')}:</span> <strong>{bookingResult.checkOutDate?.split('T')[0]}</strong></p>
              <p><span className="text-slate-500">{t('bookingPage.total')}:</span> <strong className="text-[#bfa15f]">{formatPrice(Number(bookingResult.totalPrice), locale)}</strong></p>
              <p><span className="text-slate-500">{t('bookingPage.status')}:</span> <strong>{bookingResult.bookingStatus}</strong></p>
            </div>
            <Link to="/" className="btn-gold inline-block px-8 py-3 rounded">{t('bookingPage.backHome')}</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return <BookingContent />;
}

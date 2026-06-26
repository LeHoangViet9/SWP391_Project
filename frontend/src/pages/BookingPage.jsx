import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  getStoredCustomerId,
  saveCustomerId,
  createCustomer,
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
  const navigate = useNavigate();

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

  const [bookingForOther, setBookingForOther] = useState(false);
  const [stayGuestForm, setStayGuestForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    idType: 'CCCD',
    idNumberCard: '',
    nationality: locale === 'vi' ? 'Việt Nam' : 'Vietnam',
  });


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
    // Dùng /customers/me — endpoint self-service, không cần CUSTOMER_VIEW permission
    apiFetch('/customers/me', {}, locale)
      .then((res) => {
        const found = res?.data;
        if (found?.id) {
          saveCustomerId(found.id);
          setCustomerForm({
            fullName: found.fullName || user.fullName || '',
            email:    found.email    || user.email    || '',
            phone:    found.phone    || user.phone    || '',
            idType:      found.idType      || 'CCCD',
            idNumberCard: found.idNumberCard || '',
            nationality:  found.nationality  || (locale === 'vi' ? 'Việt Nam' : 'Vietnam'),
          });
        } else {
          // Chưa có customer profile — điền sẵn thông tin từ tài khoản
          setCustomerForm((prev) => ({
            ...prev,
            fullName: user.fullName || prev.fullName,
            email:    user.email    || prev.email,
            phone:    user.phone    || prev.phone,
          }));
        }
      })
      .catch(() => {
        setCustomerForm((prev) => ({
          ...prev,
          fullName: user.fullName || prev.fullName,
          email:    user.email    || prev.email,
          phone:    user.phone    || prev.phone,
        }));
      });
  }, [user, locale]);

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const pricePerNight = roomType?.basePrice || 0;
  const totalEstimate = pricePerNight * nights * booking.quantity;

  const ensureCustomerId = async () => {
    // ── Bước 1: Nếu user đăng nhập, gọi /customers/me để lấy profile
    // Endpoint này chỉ cần isAuthenticated() — không phụ thuộc vào CUSTOMER_VIEW permission
    if (user) {
      try {
        const meRes = await apiFetch('/customers/me', {}, locale);
        if (meRes?.data?.id) {
          saveCustomerId(meRes.data.id);
          return Number(meRes.data.id);
        }
      } catch (_) {
        // chưa có profile — tiếp tục tạo mới
      }
    }

    // ── Bước 2: Nếu không đăng nhập, kiểm tra localStorage
    if (!user) {
      const stored = getStoredCustomerId();
      if (stored) return Number(stored);
    }

    // ── Bước 3: Tạo mới customer profile (cần CUSTOMER_CREATE permission)
    const res = await createCustomer({
      fullName: customerForm.fullName,
      email: user?.email || customerForm.email,
      phone: customerForm.phone,
      idType: customerForm.idType,
      idNumberCard: customerForm.idNumberCard,
      nationality: customerForm.nationality,
    }, locale);

    if (res?.data?.id) {
      saveCustomerId(res.data.id);
      return Number(res.data.id);
    }
    throw new Error(locale === 'vi' ? 'Không thể xác định thông tin khách hàng' : 'Could not resolve customer profile');
  };

  const validateForm = () => {
    if (!customerForm.fullName.trim()) {
      return locale === 'vi' ? 'Họ và tên không được để trống' : 'Full name is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerForm.email.trim() || !emailRegex.test(customerForm.email)) {
      return locale === 'vi' ? 'Email không hợp lệ' : 'Invalid email address';
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!customerForm.phone.trim() || !phoneRegex.test(customerForm.phone)) {
      return locale === 'vi' ? 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0' : 'Phone number must be 10 digits starting with 0';
    }

    const idCardRegex = /^[A-Za-z0-9\-]{6,20}$/;
    if (!customerForm.idNumberCard.trim()) {
      return locale === 'vi' ? 'Số CCCD/Passport không được để trống' : 'ID/Passport number is required';
    }
    if (!idCardRegex.test(customerForm.idNumberCard)) {
      return locale === 'vi' ? 'Số CCCD/Passport không hợp lệ (phải từ 6-20 ký tự chữ hoặc số)' : 'Invalid ID/Passport number (must be 6-20 alphanumeric characters)';
    }

    if (!customerForm.nationality.trim()) {
      return locale === 'vi' ? 'Quốc tịch không được để trống' : 'Nationality is required';
    }

    if (bookingForOther) {
      if (!stayGuestForm.fullName.trim()) {
        return locale === 'vi' ? 'Vui lòng nhập họ tên người được đặt hộ' : 'Stay guest full name is required';
      }
      if (!stayGuestForm.phone.trim() || !phoneRegex.test(stayGuestForm.phone)) {
        return locale === 'vi' ? 'Số điện thoại người được đặt hộ phải gồm 10 chữ số và bắt đầu bằng số 0' : 'Stay guest phone must be 10 digits starting with 0';
      }
      if (!stayGuestForm.idNumberCard.trim() || !idCardRegex.test(stayGuestForm.idNumberCard)) {
        return locale === 'vi' ? 'CCCD/Passport người được đặt hộ không hợp lệ' : 'Stay guest ID/Passport number is invalid';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!booking.checkIn) {
      setError(locale === 'vi' ? 'Vui lòng chọn ngày nhận phòng.' : 'Please select check-in date.');
      return;
    }
    if (!booking.checkOut) {
      setError(locale === 'vi' ? 'Vui lòng chọn ngày trả phòng.' : 'Please select check-out date.');
      return;
    }
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const todayStr = today();
    const todayDate = new Date(todayStr);

    checkInDate.setHours(0,0,0,0);
    checkOutDate.setHours(0,0,0,0);
    todayDate.setHours(0,0,0,0);

    if (checkInDate < todayDate) {
      setError(locale === 'vi' ? 'Ngày nhận phòng không được ở quá khứ.' : 'Check-in date cannot be in the past.');
      return;
    }
    if (checkOutDate <= checkInDate) {
      setError(locale === 'vi' ? 'Ngày trả phòng phải sau ngày nhận phòng.' : 'Check-out date must be after check-in date.');
      return;
    }
    if (!booking.quantity || booking.quantity < 1) {
      setError(locale === 'vi' ? 'Số lượng phòng phải ít nhất là 1.' : 'Quantity must be at least 1.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      const customerId = await ensureCustomerId();
      const payload = {
        customerId,
        roomTypeId: Number(roomTypeId),
        checkInDate: toCheckIn(booking.checkIn),
        checkOutDate: toCheckOut(booking.checkOut),
        quantity: booking.quantity,
        bookingForOther,
        guestFullName: bookingForOther ? stayGuestForm.fullName : customerForm.fullName,
        guestEmail: bookingForOther ? stayGuestForm.email : customerForm.email,
        guestPhone: bookingForOther ? stayGuestForm.phone : customerForm.phone,
        guestIdType: bookingForOther ? stayGuestForm.idType : customerForm.idType,
        guestIdNumberCard: bookingForOther ? stayGuestForm.idNumberCard : customerForm.idNumberCard,
        guestNationality: bookingForOther ? stayGuestForm.nationality : customerForm.nationality,
      };

      console.log('[Booking] POST /api/v1/bookings', payload);
      const res = await createBooking(payload, locale);
      setBookingResult(res.data);
      setStep(3);
      setTimeout(() => {
        navigate(`/invoice/${res.data.id}`);
      }, 1500);
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
              onClick={() => {
                if (!booking.checkIn) {
                  setError(locale === 'vi' ? 'Vui lòng chọn ngày nhận phòng.' : 'Please select a check-in date.');
                  return;
                }
                if (!booking.checkOut) {
                  setError(locale === 'vi' ? 'Vui lòng chọn ngày trả phòng.' : 'Please select a check-out date.');
                  return;
                }
                const checkInDate = new Date(booking.checkIn);
                const checkOutDate = new Date(booking.checkOut);
                const todayStr = today();
                const todayDate = new Date(todayStr);

                checkInDate.setHours(0,0,0,0);
                checkOutDate.setHours(0,0,0,0);
                todayDate.setHours(0,0,0,0);

                if (checkInDate < todayDate) {
                  setError(locale === 'vi' ? 'Ngày nhận phòng không được ở quá khứ.' : 'Check-in date cannot be in the past.');
                  return;
                }
                if (checkOutDate <= checkInDate) {
                  setError(locale === 'vi' ? 'Ngày trả phòng phải sau ngày nhận phòng.' : 'Check-out date must be after check-in date.');
                  return;
                }
                if (!booking.quantity || booking.quantity < 1) {
                  setError(locale === 'vi' ? 'Số lượng phòng phải ít nhất là 1.' : 'Quantity must be at least 1.');
                  return;
                }
                setError('');
                setStep(2);
              }}
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
                  value={customerForm.email}
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

            <label className="flex items-start gap-3 rounded border border-stone-200 bg-stone-50 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={bookingForOther}
                onChange={(e) => setBookingForOther(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#bfa15f]"
              />
              <span>
                <span className="block font-semibold text-slate-800">
                  {locale === 'vi' ? 'Đặt hộ người khác' : 'Book for another guest'}
                </span>
                <span className="text-slate-500">
                  {locale === 'vi'
                    ? 'Thông tin bên dưới là người sẽ trực tiếp lưu trú và cần được lễ tân kiểm tra khi check-in.'
                    : 'The information below is for the actual stay guest and will be verified at check-in.'}
                </span>
              </span>
            </label>

            {bookingForOther && (
              <div className="rounded border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-3 text-sm font-bold text-amber-800">
                  {locale === 'vi' ? 'Thông tin người được đặt hộ' : 'Stay guest information'}
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('auth.fullName')}</label>
                    <input type="text" required value={stayGuestForm.fullName} onChange={(e) => setStayGuestForm({ ...stayGuestForm, fullName: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">Email</label>
                    <input type="email" value={stayGuestForm.email} onChange={(e) => setStayGuestForm({ ...stayGuestForm, email: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('auth.phone')}</label>
                    <input type="tel" required value={stayGuestForm.phone} onChange={(e) => setStayGuestForm({ ...stayGuestForm, phone: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.idType')}</label>
                    <select value={stayGuestForm.idType} onChange={(e) => setStayGuestForm({ ...stayGuestForm, idType: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]">
                      <option value="CCCD">CCCD</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.idNumber')}</label>
                    <input type="text" required value={stayGuestForm.idNumberCard} onChange={(e) => setStayGuestForm({ ...stayGuestForm, idNumberCard: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.nationality')}</label>
                    <input type="text" value={stayGuestForm.nationality} onChange={(e) => setStayGuestForm({ ...stayGuestForm, nationality: e.target.value })} className="w-full mt-1 border border-stone-300 px-3 py-2.5 outline-none focus:border-[#bfa15f]" />
                  </div>
                </div>
              </div>
            )}
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

        {/* Step 3: Redirecting to Payment */}
        {step === 3 && bookingResult && (
          <div className="bg-white border border-stone-200 shadow-lg p-12 text-center flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-[#bfa15f]/10 rounded-full flex items-center justify-center text-[#bfa15f] animate-bounce">
              <CreditCard size={32} />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-800 mb-2">
                {locale === 'vi' ? 'Đặt phòng thành công!' : 'Booking Successful!'}
              </h3>
              <p className="text-slate-500">
                {locale === 'vi' 
                  ? 'Hệ thống đang khởi tạo hóa đơn và chuyển hướng bạn đến trang quét mã thanh toán...' 
                  : 'System is generating your invoice and redirecting you to the payment page...'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#bfa15f] font-semibold">
              <div className="w-4 h-4 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin" />
              <span>{locale === 'vi' ? 'Đang chuyển hướng...' : 'Redirecting...'}</span>
            </div>
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

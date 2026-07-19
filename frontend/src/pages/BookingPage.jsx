import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, Users, Building2, CreditCard, CheckCircle, ArrowLeft, ShoppingCart, Clock, X,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { roomTypes as mockRoomTypes } from '../data/mockData';
import { apiFetch } from '../services/api';
import {
  createCartHold,
  updateCartHold,
  getCartHold,
  deleteCartHold,
  checkoutCartHold,
} from '../services/bookingService';
import { getCombinedInvoice } from '../services/invoiceService';
import {
  getStoredCustomerId,
  saveCustomerId,
  createCustomer,
  updateCustomer,
} from '../services/customerService';
import BookingFailureModal from '../components/BookingFailureModal';

const getLocalDateString = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = () => getLocalDateString();
const CART_STORAGE_KEY = 'hms_booking_cart';
const CART_HOLD_TOKEN_KEY = 'hms_booking_cart_hold_token';
const BOOKING_HOLD_MINUTES = 30;

function loadBookingCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function loadCartHoldToken() {
  try {
    return localStorage.getItem(CART_HOLD_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function createCartKey(roomTypeId, checkIn, checkOut) {
  return `${roomTypeId}-${checkIn}-${checkOut}`;
}
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateString(d);
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

function formatHoldCountdown(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function validateGuestForms(customer, stayGuest, bookingForOther, locale) {
  const isVi = locale === 'vi';
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^0[0-9]{9}$/;
  const idCardRegex = /^[A-Za-z0-9-]{6,20}$/;
  const cccdRegex = /^\d{12}$/;
  const nameRegex = /^[\p{L}][\p{L}\s'.-]{1,99}$/u;
  const nationalityRegex = /^[\p{L}][\p{L}\s-]{1,59}$/u;

  if (!customer.fullName.trim()) errors['customer.fullName'] = isVi ? 'Vui lòng nhập họ và tên.' : 'Full name is required.';
  else if (!nameRegex.test(customer.fullName.trim())) errors['customer.fullName'] = isVi ? 'Họ tên chỉ được chứa chữ cái, khoảng trắng và dấu hợp lệ.' : 'Full name contains invalid characters.';
  if (!customer.email.trim()) errors['customer.email'] = isVi ? 'Vui lòng nhập email.' : 'Email is required.';
  else if (!emailRegex.test(customer.email.trim())) errors['customer.email'] = isVi ? 'Email không đúng định dạng.' : 'Invalid email format.';
  if (!customer.phone.trim()) errors['customer.phone'] = isVi ? 'Vui lòng nhập số điện thoại.' : 'Phone number is required.';
  else if (!phoneRegex.test(customer.phone.trim())) errors['customer.phone'] = isVi ? 'Số điện thoại phải có 10 số và bắt đầu bằng 0.' : 'Phone number must have 10 digits and start with 0.';
  if (!customer.idType) errors['customer.idType'] = isVi ? 'Vui lòng chọn loại giấy tờ.' : 'ID type is required.';
  if (!customer.idNumberCard.trim()) errors['customer.idNumberCard'] = isVi ? 'Vui lòng nhập số giấy tờ.' : 'ID/Passport number is required.';
  else if (customer.idType === 'CCCD' && !cccdRegex.test(customer.idNumberCard.trim())) errors['customer.idNumberCard'] = isVi ? 'CCCD phải gồm đúng 12 chữ số.' : 'CCCD must contain exactly 12 digits.';
  else if (customer.idType !== 'CCCD' && !idCardRegex.test(customer.idNumberCard.trim())) errors['customer.idNumberCard'] = isVi ? 'Số Passport/giấy tờ phải có 6–20 ký tự chữ, số hoặc dấu gạch ngang.' : 'ID/Passport must contain 6–20 letters, numbers, or hyphens.';
  if (!customer.nationality.trim()) errors['customer.nationality'] = isVi ? 'Vui lòng nhập quốc tịch.' : 'Nationality is required.';
  else if (!nationalityRegex.test(customer.nationality.trim())) errors['customer.nationality'] = isVi ? 'Quốc tịch chỉ được chứa chữ cái, khoảng trắng hoặc dấu gạch ngang.' : 'Nationality contains invalid characters.';

  if (bookingForOther) {
    if (!stayGuest.fullName.trim()) errors['stayGuest.fullName'] = isVi ? 'Vui lòng nhập họ tên người lưu trú.' : 'Stay guest full name is required.';
    if (stayGuest.email.trim() && !emailRegex.test(stayGuest.email.trim())) errors['stayGuest.email'] = isVi ? 'Email không đúng định dạng.' : 'Invalid email format.';
    if (!stayGuest.phone.trim()) errors['stayGuest.phone'] = isVi ? 'Vui lòng nhập số điện thoại người lưu trú.' : 'Stay guest phone number is required.';
    else if (!phoneRegex.test(stayGuest.phone.trim())) errors['stayGuest.phone'] = isVi ? 'Số điện thoại phải có 10 số và bắt đầu bằng 0.' : 'Phone number must have 10 digits and start with 0.';
    if (!stayGuest.idNumberCard.trim()) errors['stayGuest.idNumberCard'] = isVi ? 'Vui lòng nhập số giấy tờ người lưu trú.' : 'Stay guest ID/Passport is required.';
    else if (stayGuest.idType === 'CCCD' && !cccdRegex.test(stayGuest.idNumberCard.trim())) errors['stayGuest.idNumberCard'] = isVi ? 'CCCD phải gồm đúng 12 chữ số.' : 'CCCD must contain exactly 12 digits.';
    else if (stayGuest.idType !== 'CCCD' && !idCardRegex.test(stayGuest.idNumberCard.trim())) errors['stayGuest.idNumberCard'] = isVi ? 'Số Passport/giấy tờ phải có 6–20 ký tự hợp lệ.' : 'ID/Passport must contain 6–20 valid characters.';
    else if (customer.idType === 'CCCD' && stayGuest.idType === 'CCCD' && customer.idNumberCard.trim() === stayGuest.idNumberCard.trim()) errors['stayGuest.idNumberCard'] = isVi ? 'CCCD người lưu trú không được trùng với người đặt.' : 'Stay guest CCCD must differ from the booker CCCD.';
    if (!stayGuest.nationality.trim()) errors['stayGuest.nationality'] = isVi ? 'Vui lòng nhập quốc tịch người lưu trú.' : 'Stay guest nationality is required.';
  }

  return errors;
}

function validateRoomSelection(booking, guestCounts, maxGuests, locale) {
  const isVi = locale === 'vi';
  const errors = {};
  const todayDate = new Date(today());
  todayDate.setHours(0, 0, 0, 0);

  if (!booking.checkIn) {
    errors.checkIn = isVi ? 'Vui lòng chọn ngày nhận phòng.' : 'Please select a check-in date.';
  } else {
    const checkInDate = new Date(booking.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    if (checkInDate < todayDate) errors.checkIn = isVi ? 'Ngày nhận phòng không được ở quá khứ.' : 'Check-in date cannot be in the past.';
  }

  if (!booking.checkOut) {
    errors.checkOut = isVi ? 'Vui lòng chọn ngày trả phòng.' : 'Please select a check-out date.';
  } else if (booking.checkIn) {
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    if (checkOutDate <= checkInDate) errors.checkOut = isVi ? 'Ngày trả phòng phải sau ngày nhận phòng.' : 'Check-out date must be after check-in date.';
  }

  if (!booking.quantity || booking.quantity < 1) errors.quantity = isVi ? 'Phải chọn ít nhất một phòng.' : 'Select at least one room.';

  guestCounts.forEach((guests, index) => {
    const adults = Number(guests.adults || 0);
    const totalGuests = adults + Number(guests.children || 0) + Number(guests.infants || 0);
    if (adults < 1) {
      errors[`guests.${index}`] = isVi ? `Phòng ${index + 1} phải có ít nhất 1 người lớn.` : `Room ${index + 1} must have at least 1 adult.`;
    } else if (Number(maxGuests) > 0 && totalGuests > Number(maxGuests)) {
      errors[`guests.${index}`] = isVi
        ? `Phòng ${index + 1} tối đa ${maxGuests} người, hiện đang chọn ${totalGuests} người.`
        : `Room ${index + 1} allows up to ${maxGuests} guests; ${totalGuests} are selected.`;
    }
  });

  return errors;
}

function BookingContent() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const isReceptionist = user?.roleName === 'RECEPTIONIST';
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const roomTypeId = params.get('roomTypeId') || '1';
  const [roomType, setRoomType] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  const [failureModalOpen, setFailureModalOpen] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(BOOKING_HOLD_MINUTES * 60);
  const [guestCounts, setGuestCounts] = useState([{ adults: 1, children: 0, infants: 0 }]);
  const [cartItems, setCartItems] = useState(loadBookingCart);
  const [cartHoldToken, setCartHoldToken] = useState(loadCartHoldToken);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const cartMutationVersion = useRef(0);
  const [bookingResults, setBookingResults] = useState([]);
  const [combinedInvoiceTotal, setCombinedInvoiceTotal] = useState(0);

  const [booking, setBooking] = useState({
    checkIn: params.get('checkIn') || today(),
    checkOut: params.get('checkOut') || tomorrow(),
    quantity: 1,
  });

  const [customerForm, setCustomerForm] = useState({
    fullName: isReceptionist ? '' : (user?.fullName || ''),
    email: isReceptionist ? '' : (user?.email || ''),
    phone: isReceptionist ? '' : (user?.phone || ''),
    idType: isReceptionist ? '' : 'CCCD',
    idNumberCard: '',
    nationality: isReceptionist ? '' : (locale === 'vi' ? 'Việt Nam' : 'Vietnam'),
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
  const [touchedFields, setTouchedFields] = useState({});
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [touchedSelectionFields, setTouchedSelectionFields] = useState({});


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
            imageUrl: rt.imageUrl || rt.imageUrls?.[0] || mock?.imageUrl || mockRoomTypes[0].imageUrl,
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
    setAvailableRoomsCount(null);
    setError('');

    const checkInDateTime = toCheckIn(booking.checkIn);
    const checkOutDateTime = toCheckOut(booking.checkOut);

    apiFetch(`/bookings/check-availability?roomTypeId=${roomTypeId}&checkInDate=${encodeURIComponent(checkInDateTime)}&checkOutDate=${encodeURIComponent(checkOutDateTime)}`, {}, locale)
      .then((res) => {
        if (res && res.data !== undefined) {
          const parsedCount = Number(res.data);
          const availableCount = Number.isFinite(parsedCount) ? Math.max(0, Math.floor(parsedCount)) : 0;
          setAvailableRoomsCount(availableCount);
          setBooking((current) => {
            const nextQuantity = availableCount === 0
              ? 0
              : Math.min(Math.max(current.quantity || 1, 1), availableCount);
            return nextQuantity === current.quantity
              ? current
              : { ...current, quantity: nextQuantity };
          });
          if (availableCount === 0) {
            setError(locale === 'vi'
              ? 'Loại phòng này đã hết phòng trong khoảng thời gian đã chọn.'
              : 'This room type is sold out for the selected dates.');
          }
        }
      })
      .catch((err) => {
        console.error('Error checking availability:', err);
      })
      .finally(() => {
        setCheckingAvailability(false);
      });
  }, [roomTypeId, booking.checkIn, booking.checkOut, locale]);

  useEffect(() => {
    setGuestCounts((current) => Array.from(
      { length: booking.quantity },
      (_, index) => current[index] || { adults: 1, children: 0, infants: 0 },
    ));
  }, [booking.quantity]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!cartHoldToken) return undefined;
    let mounted = true;
    const requestVersion = cartMutationVersion.current;
    getCartHold(cartHoldToken, locale)
      .then((res) => {
        if (!mounted || requestVersion !== cartMutationVersion.current || !res?.data) return;
        const serverItems = res.data.items || [];
        setCartItems((current) => serverItems.map((serverItem, index) => ({
          ...(current[index] || {}),
          key: createCartKey(
            serverItem.roomTypeId,
            serverItem.checkInDate?.split('T')[0],
            serverItem.checkOutDate?.split('T')[0],
          ),
          holdItemId: serverItem.id,
          roomTypeId: serverItem.roomTypeId,
          roomTypeName: serverItem.roomTypeName,
          pricePerNight: Number(serverItem.pricePerNight || current[index]?.pricePerNight || 0),
          checkIn: serverItem.checkInDate?.split('T')[0],
          checkOut: serverItem.checkOutDate?.split('T')[0],
          quantity: serverItem.quantity,
          guestCounts: current[index]?.guestCounts || Array.from(
            { length: serverItem.quantity },
            () => ({ adults: 1, children: 0, infants: 0 }),
          ),
        })));
        setHoldExpiresAt(res.data.expiresAt || null);
      })
      .catch((err) => {
        if (!mounted || requestVersion !== cartMutationVersion.current) return;
        localStorage.removeItem(CART_HOLD_TOKEN_KEY);
        setCartHoldToken('');
        setHoldExpiresAt(null);
        if (err?.status === 404 || err?.status === 409) {
          localStorage.removeItem(CART_STORAGE_KEY);
          setCartItems([]);
        }
        setStep(1);
        setError(locale === 'vi'
          ? 'Phòng trong giỏ chưa còn được giữ. Vui lòng bấm tiếp tục để giữ lại.'
          : 'The rooms in your cart are no longer held. Continue to hold them again.');
      });
    return () => { mounted = false; };
  }, [cartHoldToken, locale]);

  useEffect(() => {
    const expiry = holdExpiresAt || bookingResult?.holdExpiresAt;
    if (!expiry) return undefined;
    let expirationHandled = false;
    const updateCountdown = () => setRemainingSeconds(Math.max(
      0,
      Math.floor((new Date(expiry).getTime() - Date.now()) / 1000),
    ));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    if (cartHoldToken) {
      const checkExpiration = async () => {
        if (expirationHandled || new Date(expiry).getTime() > Date.now()) return;
        expirationHandled = true;
        try {
          await deleteCartHold(cartHoldToken, locale);
        } catch {
          // The scheduler will release an already-expired hold if this request fails.
        }
        localStorage.removeItem(CART_HOLD_TOKEN_KEY);
        localStorage.removeItem(CART_STORAGE_KEY);
        setCartHoldToken('');
        setHoldExpiresAt(null);
        setCartItems([]);
        setStep(1);
        setError(locale === 'vi' ? 'Thời gian giữ phòng đã hết. Vui lòng chọn lại.' : 'The room hold expired. Please select again.');
      };
      const expirationTimer = window.setInterval(checkExpiration, 1000);
      checkExpiration();
      return () => {
        window.clearInterval(timer);
        window.clearInterval(expirationTimer);
      };
    }
    return () => window.clearInterval(timer);
  }, [holdExpiresAt, bookingResult, cartHoldToken, locale]);

  useEffect(() => {
    if (!user || isReceptionist) return;
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
  }, [user, locale, isReceptionist]);

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const pricePerNight = roomType?.basePrice || 0;
  const totalEstimate = pricePerNight * nights * booking.quantity;
  const currentCartKey = createCartKey(roomTypeId, booking.checkIn, booking.checkOut);
  const currentCartItem = cartItems.find((item) => item.key === currentCartKey);
  const currentSelectionInCart = Boolean(
    currentCartItem
    && currentCartItem.quantity === booking.quantity
    && JSON.stringify(currentCartItem.guestCounts) === JSON.stringify(guestCounts),
  );
  const cartTotal = cartItems.reduce((total, item) => (
    total + Number(item.pricePerNight || 0)
      * nightsBetween(item.checkIn, item.checkOut)
      * Number(item.quantity || 0)
  ), 0);
  const formErrors = {
    ...validateGuestForms(customerForm, stayGuestForm, bookingForOther, locale),
    ...serverFieldErrors,
  };
  const selectionErrors = validateRoomSelection(booking, guestCounts, roomType?.maxGuests, locale);
  const touchField = (field) => setTouchedFields((current) => ({ ...current, [field]: true }));
  const updateCustomerField = (field, value) => {
    setCustomerForm((current) => ({ ...current, [field]: value }));
    setServerFieldErrors((current) => {
      const next = { ...current };
      delete next[`customer.${field}`];
      return next;
    });
  };
  const touchSelectionField = (field) => setTouchedSelectionFields((current) => ({ ...current, [field]: true }));
  const fieldClassName = (field, extra = '') => `w-full mt-1 border px-3 py-2.5 outline-none transition-colors ${
    touchedFields[field] && formErrors[field]
      ? 'border-red-400 bg-red-50 focus:border-red-500'
      : 'border-stone-300 focus:border-[#bfa15f]'
  } ${extra}`;
  const renderFieldError = (field) => touchedFields[field] && formErrors[field]
    ? <p className="mt-1 text-xs font-medium text-red-600">{formErrors[field]}</p>
    : null;
  const selectionFieldClassName = (field) => `w-full mt-1 border px-3 py-2.5 outline-none transition-colors ${
    touchedSelectionFields[field] && selectionErrors[field]
      ? 'border-red-400 bg-red-50 focus:border-red-500'
      : 'border-stone-300 focus:border-[#bfa15f]'
  }`;
  const renderSelectionError = (field) => touchedSelectionFields[field] && selectionErrors[field]
    ? <p className="mt-1 text-xs font-medium text-red-600">{selectionErrors[field]}</p>
    : null;

  const ensureCustomerId = async () => {
    if (isReceptionist) {
      const res = await createCustomer({
        fullName: customerForm.fullName.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim(),
        idType: customerForm.idType,
        idNumberCard: customerForm.idNumberCard.trim(),
        nationality: customerForm.nationality.trim(),
      }, locale);
      if (res?.data?.id) return Number(res.data.id);
      throw new Error(locale === 'vi' ? 'Không thể tạo hồ sơ khách hàng.' : 'Could not create customer profile.');
    }
    // ── Bước 1: Nếu user đăng nhập, gọi /customers/me để lấy profile
    // Endpoint này chỉ cần isAuthenticated() — không phụ thuộc vào CUSTOMER_VIEW permission
    if (user) {
      try {
        const meRes = await apiFetch('/customers/me', {}, locale);
        if (meRes?.data?.id) {
          const profile = meRes.data;
          if (
            (customerForm.fullName && customerForm.fullName.trim() !== (profile.fullName || '').trim()) ||
            (customerForm.phone && customerForm.phone.trim() !== (profile.phone || '').trim()) ||
            (customerForm.idType && customerForm.idType !== profile.idType) ||
            (customerForm.idNumberCard && customerForm.idNumberCard.trim() !== (profile.idNumberCard || '').trim()) ||
            (customerForm.nationality && customerForm.nationality.trim() !== (profile.nationality || '').trim())
          ) {
            await updateCustomer(profile.id, {
              fullName: customerForm.fullName.trim(),
              email: customerForm.email.trim(),
              phone: customerForm.phone.trim(),
              idType: customerForm.idType,
              idNumberCard: customerForm.idNumberCard.trim(),
              nationality: customerForm.nationality.trim(),
            }, locale);
          }
          saveCustomerId(profile.id);
          return Number(profile.id);
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

  const syncCartHold = async (nextItems) => {
    cartMutationVersion.current += 1;
    setLoading(true);
    try {
      if (nextItems.length === 0) {
        if (cartHoldToken) await deleteCartHold(cartHoldToken, locale);
        localStorage.removeItem(CART_HOLD_TOKEN_KEY);
        setCartHoldToken('');
        setHoldExpiresAt(null);
        setCartItems([]);
        return null;
      }

      const payload = {
        items: nextItems.map((item) => ({
          roomTypeId: Number(item.roomTypeId),
          checkInDate: toCheckIn(item.checkIn),
          checkOutDate: toCheckOut(item.checkOut),
          quantity: Number(item.quantity),
        })),
      };
      const response = cartHoldToken
        ? await updateCartHold(cartHoldToken, payload, locale)
        : await createCartHold(payload, locale);
      const hold = response?.data;
      if (!hold?.holdToken) throw new Error(locale === 'vi' ? 'Không thể giữ phòng.' : 'Could not hold rooms.');

      const serverItems = hold.items || [];
      const mappedItems = nextItems.map((item, index) => ({
        ...item,
        holdItemId: serverItems[index]?.id,
      }));
      setCartItems(mappedItems);
      setCartHoldToken(hold.holdToken);
      setHoldExpiresAt(hold.expiresAt || null);
      localStorage.setItem(CART_HOLD_TOKEN_KEY, hold.holdToken);
      return hold;
    } catch (err) {
      setError(err.message || (locale === 'vi' ? 'Không thể giữ phòng trong giỏ hàng.' : 'Could not hold the cart rooms.'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCartItem = async (itemKey) => {
    try {
      await syncCartHold(cartItems.filter((item) => item.key !== itemKey));
    } catch {
      // syncCartHold already shows the server error beside the cart.
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (cartItems.length === 0) {
      setError(locale === 'vi' ? 'Giỏ hàng chưa có phòng.' : 'Your cart is empty.');
      return;
    }
    const todayDate = new Date(today());
    todayDate.setHours(0, 0, 0, 0);
    const invalidCartItem = cartItems.find((item) => {
      const checkInDate = new Date(item.checkIn);
      const checkOutDate = new Date(item.checkOut);
      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);
      return checkInDate < todayDate || checkOutDate <= checkInDate || !item.quantity;
    });
    if (invalidCartItem) {
      setError(locale === 'vi'
        ? `Thời gian lưu trú của ${invalidCartItem.roomTypeName} không còn hợp lệ. Vui lòng xóa phòng này và chọn lại.`
        : `The stay dates for ${invalidCartItem.roomTypeName} are no longer valid. Please remove it and select again.`);
      return;
    }

    const invalidFields = Object.keys(formErrors);
    if (invalidFields.length > 0) {
      setTouchedFields((current) => ({
        ...current,
        ...Object.fromEntries(invalidFields.map((field) => [field, true])),
      }));
      return;
    }
    if (!cartHoldToken || cartItems.some((item) => !item.holdItemId)) {
      setError(locale === 'vi' ? 'Giỏ phòng chưa được giữ trên máy chủ. Vui lòng thêm lại phòng.' : 'The cart is not held on the server. Please add the rooms again.');
      return;
    }

    setLoading(true);
    try {
      const customerId = await ensureCustomerId();
      const checkoutPayload = {
        customerId,
        bookingForOther,
        guestFullName: bookingForOther ? stayGuestForm.fullName : customerForm.fullName,
        guestEmail: bookingForOther ? stayGuestForm.email : customerForm.email,
        guestPhone: bookingForOther ? stayGuestForm.phone : customerForm.phone,
        guestIdType: bookingForOther ? stayGuestForm.idType : customerForm.idType,
        guestIdNumberCard: bookingForOther ? stayGuestForm.idNumberCard : customerForm.idNumberCard,
        guestNationality: bookingForOther ? stayGuestForm.nationality : customerForm.nationality,
        items: cartItems.map((item) => ({
          holdItemId: item.holdItemId,
          roomGuests: item.guestCounts,
        })),
      };
      const checkoutResponse = await checkoutCartHold(cartHoldToken, checkoutPayload, locale);
      const createdBookings = checkoutResponse?.data?.bookings || [];
      if (createdBookings.length === 0) throw new Error(locale === 'vi' ? 'Không tạo được booking.' : 'No booking was created.');

      const createdBookingIds = createdBookings.map((created) => created.id);
      const fallbackTotal = createdBookings.reduce((total, created) => total + Number(created.totalPrice || 0), 0);
      try {
        const combinedInvoiceRes = await getCombinedInvoice(createdBookingIds, locale);
        setCombinedInvoiceTotal(Number(combinedInvoiceRes?.data?.totalAmount ?? fallbackTotal));
      } catch {
        setCombinedInvoiceTotal(fallbackTotal);
      }
      setBookingResults(createdBookings);
      setBookingResult(createdBookings[0]);
      setCartItems([]);
      setCartHoldToken('');
      setHoldExpiresAt(null);
      localStorage.removeItem(CART_HOLD_TOKEN_KEY);
      localStorage.removeItem(CART_STORAGE_KEY);
      if (isReceptionist) {
        const bookingQuery = createdBookingIds.map((id) => `bookingIds=${encodeURIComponent(id)}`).join('&');
        navigate(`/invoice/batch?${bookingQuery}&receptionistPayment=true`);
        return;
      }
      setStep(3);
    } catch (err) {
      const baseMessage = err.message || t('bookingPage.submitFailed');
      const backendErrors = err.data?.data;
      const customerFields = new Set(['fullName', 'email', 'phone', 'idType', 'idNumberCard', 'nationality']);
      const mappedErrors = backendErrors && typeof backendErrors === 'object' && !Array.isArray(backendErrors)
        ? Object.fromEntries(Object.entries(backendErrors)
          .filter(([field]) => customerFields.has(field))
          .map(([field, message]) => [`customer.${field}`, message]))
        : {};
      if (Object.keys(mappedErrors).length > 0) {
        setServerFieldErrors(mappedErrors);
        setTouchedFields((current) => ({
          ...current,
          ...Object.fromEntries(Object.keys(mappedErrors).map((field) => [field, true])),
        }));
        return;
      }
      setFailureMessage(baseMessage);
      setFailureModalOpen(true);
      setError(baseMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = async () => {
    setError('');
    const invalidSelectionFields = Object.keys(selectionErrors);
    if (invalidSelectionFields.length > 0) {
      setTouchedSelectionFields((current) => ({
        ...current,
        ...Object.fromEntries(invalidSelectionFields.map((field) => [field, true])),
      }));
      return;
    }
    if (availableRoomsCount !== null && booking.quantity > availableRoomsCount) {
      setError(locale === 'vi' ? 'Số phòng chọn vượt quá số phòng đang trống.' : 'Selected quantity exceeds available rooms.');
      return;
    }
    const nextItem = {
      key: currentCartKey,
      roomTypeId: Number(roomTypeId),
      roomTypeName: roomType.typeName,
      pricePerNight,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      quantity: booking.quantity,
      guestCounts: guestCounts.map((guests) => ({ ...guests })),
    };
    const nextItems = [
      ...cartItems.filter((item) => item.key !== currentCartKey),
      nextItem,
    ];
    try {
      await syncCartHold(nextItems);
    } catch {
      // syncCartHold already shows the server error beside the cart.
    }
  };

  const handleCartAction = async () => {
    setError('');
    if (step === 1) {
      if (cartItems.length === 0) {
        setError(locale === 'vi' ? 'Vui lòng chọn phòng và thêm vào giỏ trước.' : 'Please select a room and add it to the cart first.');
        return;
      }
      if (!cartHoldToken || cartItems.some((item) => !item.holdItemId)) {
        try {
          await syncCartHold(cartItems);
        } catch {
          return;
        }
      }
      setStep(2);
      return;
    }
    if (step === 2) await handleSubmit();
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-6">
          <ArrowLeft size={16} />
          {t('bookingPage.backHome')}
        </Link>

        <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">{t('bookingPage.title')}</h1>
        <p className="text-slate-500 mb-8">{t('bookingPage.subtitle')}</p>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <section className="min-w-0">
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
        <div className="bg-white border border-stone-200 shadow-sm mb-6 overflow-hidden rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-[360px_1fr]">
            <img src={roomType.imageUrl} alt={roomType.typeName} className="h-60 w-full object-cover" />
            <div className="p-6">
              <h2 className="font-display text-2xl font-bold text-slate-800 mb-3">{roomType.typeName}</h2>
              <p className="text-slate-600 text-sm mb-4 line-clamp-2">{roomType.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Users size={14} className="text-[#bfa15f]" />{roomType.maxGuests} {t('rooms.guests')}</span>
                <span className="flex items-center gap-1"><Building2 size={14} className="text-[#bfa15f]" />{booking.quantity} {t('booking.rooms')}</span>
              </div>
              <div className="mt-8">
                <div>
                  <p className="text-sm text-slate-500">{locale === 'vi' ? 'Giá chỉ từ' : 'Price from'}</p>
                  <p className="mt-1 text-2xl font-bold text-[#f2a900]">{formatPrice(pricePerNight, locale)} <span className="text-sm font-normal text-slate-600">/ {locale === 'vi' ? 'đêm' : 'night'}</span></p>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-dashed border-stone-300 px-6 py-5 text-sm">
            <p className="font-semibold text-red-500">FREE CANCELLATION DKDT</p>
            <p className="mt-3 text-slate-600">✓ {locale === 'vi' ? 'Đã bao gồm ăn sáng' : 'Breakfast included'}</p>
            <p className="mt-2 text-emerald-600">★ {locale === 'vi' ? 'Miễn phí hồ bơi và phòng gym' : 'Free pool and gym access'}</p>
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
                    touchSelectionField('checkIn');
                    touchSelectionField('checkOut');
                    setBooking((prev) => {
                      const updated = { ...prev, checkIn: newCheckIn };
                      if (!prev.checkOut || prev.checkOut <= newCheckIn) {
                        const nextDay = new Date(newCheckIn);
                        nextDay.setDate(nextDay.getDate() + 1);
                        updated.checkOut = getLocalDateString(nextDay);
                      }
                      return updated;
                    });
                  }}
                  onBlur={() => touchSelectionField('checkIn')}
                  className={selectionFieldClassName('checkIn')}
                />
                {renderSelectionError('checkIn')}
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
                    return getLocalDateString(dt);
                  })()}
                  onChange={(e) => {
                    touchSelectionField('checkOut');
                    setBooking({ ...booking, checkOut: e.target.value });
                  }}
                  onBlur={() => touchSelectionField('checkOut')}
                  className={selectionFieldClassName('checkOut')}
                />
                {renderSelectionError('checkOut')}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">
                  {locale === 'vi' ? 'Số lượng phòng' : 'Number of rooms'}
                </label>
                <select
                  value={availableRoomsCount === 0 ? '' : booking.quantity}
                  disabled={checkingAvailability || availableRoomsCount === null || availableRoomsCount === 0}
                  onChange={(e) => { touchSelectionField('quantity'); setBooking({ ...booking, quantity: Number(e.target.value) }); }}
                  className={`${selectionFieldClassName('quantity')} ${availableRoomsCount === 0
                    ? 'border-red-500 bg-red-50 font-semibold text-red-700 disabled:border-red-500 disabled:bg-red-50 disabled:text-red-700'
                    : 'disabled:bg-stone-100 disabled:text-slate-400'} disabled:cursor-not-allowed`}
                >
                  {availableRoomsCount === 0 ? (
                    <option value="">{locale === 'vi' ? 'Đã hết phòng' : 'Sold out'}</option>
                  ) : Array.from({ length: availableRoomsCount ?? 0 }, (_, index) => index + 1).map((quantity) => (
                    <option key={quantity} value={quantity}>{quantity} {locale === 'vi' ? 'phòng' : 'rooms'}</option>
                  ))}
                </select>
                <p className={`mt-1 text-xs font-medium ${availableRoomsCount === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {checkingAvailability || availableRoomsCount === null
                    ? (locale === 'vi' ? 'Đang kiểm tra phòng trống...' : 'Checking available rooms...')
                    : availableRoomsCount === 0
                      ? (locale === 'vi' ? 'Đã hết phòng trong thời gian đã chọn' : 'Sold out for the selected dates')
                      : (locale === 'vi' ? `Còn ${availableRoomsCount} phòng trống` : `${availableRoomsCount} rooms available`)}
                </p>
                {renderSelectionError('quantity')}
              </div>
            </div>
            <div className="bg-stone-50 p-4 flex justify-between items-center">
              <span className="text-slate-600">{nights} {t('bookingPage.nights')} × {booking.quantity || 0} {t('booking.rooms')}</span>
              <span className="text-xl font-bold text-[#bfa15f]">{formatPrice(totalEstimate, locale)}</span>
            </div>
            <div className="space-y-4 border-y border-dashed border-stone-300 py-5">
              {guestCounts.map((guests, roomIndex) => (
                <div key={roomIndex} className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr_1fr_1fr] sm:items-end">
                  <h4 className="font-bold text-slate-800">
                    {locale === 'vi' ? `Số người phòng ${roomIndex + 1}` : `Guests in room ${roomIndex + 1}`}
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {locale === 'vi' ? `Tối đa ${roomType.maxGuests} người` : `Up to ${roomType.maxGuests} guests`}
                    </span>
                  </h4>
                  {[
                    ['adults', locale === 'vi' ? 'Người lớn' : 'Adults', 4],
                    ['children', locale === 'vi' ? 'Trẻ em (6-11 tuổi)' : 'Children (6-11)', 3],
                    ['infants', locale === 'vi' ? 'Em bé (0-5 tuổi)' : 'Infants (0-5)', 2],
                  ].map(([key, label, max]) => (
                    <label key={key} className="text-sm text-slate-600">
                      <span className="mb-1 block">{label}</span>
                      <select
                        value={guests[key]}
                        onChange={(e) => {
                          touchSelectionField(`guests.${roomIndex}`);
                          setGuestCounts((current) => current.map((item, index) => index === roomIndex ? { ...item, [key]: Number(e.target.value) } : item));
                        }}
                        className={`w-full rounded border bg-white px-3 py-2.5 outline-none ${touchedSelectionFields[`guests.${roomIndex}`] && selectionErrors[`guests.${roomIndex}`] ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-stone-300 focus:border-[#f2a900]'}`}
                      >
                        {Array.from({ length: max + 1 }, (_, value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                  ))}
                  {touchedSelectionFields[`guests.${roomIndex}`] && selectionErrors[`guests.${roomIndex}`] && (
                    <p className="text-xs font-medium text-red-600 sm:col-start-2 sm:col-span-3">{selectionErrors[`guests.${roomIndex}`]}</p>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSelectRoom}
              disabled={currentSelectionInCart || loading || checkingAvailability || availableRoomsCount === null || availableRoomsCount === 0 || booking.quantity > availableRoomsCount}
              className="w-full btn-gold py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (locale === 'vi' ? 'Đang giữ phòng...' : 'Holding rooms...')
                : checkingAvailability
                ? (locale === 'vi' ? 'Đang kiểm tra phòng trống...' : 'Checking availability...')
                : currentSelectionInCart
                  ? (locale === 'vi' ? 'Đã thêm vào giỏ' : 'Added to cart')
                  : currentCartItem
                    ? (locale === 'vi' ? 'Cập nhật giỏ hàng' : 'Update cart')
                    : (locale === 'vi' ? 'Chọn phòng' : 'Select room')}
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
                <input type="text" required value={customerForm.fullName} onChange={(e) => updateCustomerField('fullName', e.target.value)} onBlur={() => touchField('customer.fullName')} className={fieldClassName('customer.fullName')} />
                {renderFieldError('customer.fullName')}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">Email</label>
                <input
                  type="email" required
                  value={customerForm.email}
                  onChange={(e) => updateCustomerField('email', e.target.value)}
                  onBlur={() => touchField('customer.email')}
                  readOnly={!isReceptionist && !!user?.email}
                  className={fieldClassName('customer.email', !isReceptionist && user?.email ? 'bg-stone-50 text-slate-500 cursor-not-allowed' : '')}
                />
                {!isReceptionist && user?.email && <p className="text-xs text-slate-400 mt-0.5">{locale === 'vi' ? 'Email tài khoản đăng nhập' : 'Logged-in account email'}</p>}
                {renderFieldError('customer.email')}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('auth.phone')}</label>
                <input type="tel" required inputMode="numeric" maxLength={10} value={customerForm.phone} onChange={(e) => updateCustomerField('phone', e.target.value)} onBlur={() => touchField('customer.phone')} className={fieldClassName('customer.phone')} />
                {renderFieldError('customer.phone')}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.idType')}</label>
                <select value={customerForm.idType} onChange={(e) => updateCustomerField('idType', e.target.value)} onBlur={() => touchField('customer.idType')} className={fieldClassName('customer.idType')}>
                  <option value="">{locale === 'vi' ? '-- Chọn loại giấy tờ --' : '-- Select ID type --'}</option>
                  <option value="CCCD">CCCD</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="OTHER">Other</option>
                </select>
                {renderFieldError('customer.idType')}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.idNumber')}</label>
                <input
                  type="text"
                  required
                  inputMode={customerForm.idType === 'CCCD' ? 'numeric' : 'text'}
                  maxLength={customerForm.idType === 'CCCD' ? 12 : 20}
                  pattern={customerForm.idType === 'CCCD' ? '[0-9]{12}' : '[A-Za-z0-9-]{6,20}'}
                  value={customerForm.idNumberCard}
                  onChange={(e) => updateCustomerField('idNumberCard', e.target.value)}
                  onBlur={() => touchField('customer.idNumberCard')}
                  className={fieldClassName('customer.idNumberCard')}
                />
                {renderFieldError('customer.idNumberCard')}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.nationality')}</label>
                <input type="text" required value={customerForm.nationality} onChange={(e) => updateCustomerField('nationality', e.target.value)} onBlur={() => touchField('customer.nationality')} className={fieldClassName('customer.nationality')} />
                {renderFieldError('customer.nationality')}
              </div>
            </div>

            {!isReceptionist && <label className="flex items-start gap-3 rounded border border-stone-200 bg-stone-50 p-4 text-sm text-slate-700">
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
            </label>}

            {bookingForOther && (
              <div className="rounded border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-3 text-sm font-bold text-amber-800">
                  {locale === 'vi' ? 'Thông tin người được đặt hộ' : 'Stay guest information'}
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('auth.fullName')}</label>
                    <input type="text" required value={stayGuestForm.fullName} onChange={(e) => setStayGuestForm({ ...stayGuestForm, fullName: e.target.value })} onBlur={() => touchField('stayGuest.fullName')} className={fieldClassName('stayGuest.fullName')} />
                    {renderFieldError('stayGuest.fullName')}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">Email</label>
                    <input type="email" value={stayGuestForm.email} onChange={(e) => setStayGuestForm({ ...stayGuestForm, email: e.target.value })} onBlur={() => touchField('stayGuest.email')} className={fieldClassName('stayGuest.email')} />
                    {renderFieldError('stayGuest.email')}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('auth.phone')}</label>
                    <input type="tel" required value={stayGuestForm.phone} onChange={(e) => setStayGuestForm({ ...stayGuestForm, phone: e.target.value })} onBlur={() => touchField('stayGuest.phone')} className={fieldClassName('stayGuest.phone')} />
                    {renderFieldError('stayGuest.phone')}
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
                    <input
                      type="text"
                      required
                      inputMode={stayGuestForm.idType === 'CCCD' ? 'numeric' : 'text'}
                      maxLength={stayGuestForm.idType === 'CCCD' ? 12 : 20}
                      pattern={stayGuestForm.idType === 'CCCD' ? '[0-9]{12}' : '[A-Za-z0-9-]{6,20}'}
                      value={stayGuestForm.idNumberCard}
                      onChange={(e) => setStayGuestForm({ ...stayGuestForm, idNumberCard: e.target.value })}
                      onBlur={() => touchField('stayGuest.idNumberCard')}
                      className={fieldClassName('stayGuest.idNumberCard')}
                    />
                    {renderFieldError('stayGuest.idNumberCard')}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#bfa15f] font-semibold">{t('bookingPage.nationality')}</label>
                    <input type="text" required value={stayGuestForm.nationality} onChange={(e) => setStayGuestForm({ ...stayGuestForm, nationality: e.target.value })} onBlur={() => touchField('stayGuest.nationality')} className={fieldClassName('stayGuest.nationality')} />
                    {renderFieldError('stayGuest.nationality')}
                  </div>
                </div>
              </div>
            )}
            <div className="bg-stone-50 p-4">
              {cartItems.map((item) => (
                <div key={item.key} className="mb-2 flex justify-between gap-3 text-sm text-slate-600">
                  <span>{item.roomTypeName} × {item.quantity}</span>
                  <span>{formatPrice(Number(item.pricePerNight) * nightsBetween(item.checkIn, item.checkOut) * item.quantity, locale)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-slate-800">
                <span>{t('bookingPage.total')}</span>
                <span className="text-[#bfa15f]">{formatPrice(cartTotal, locale)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-stone-300 text-slate-600 font-medium hover:border-[#bfa15f] transition-colors">{t('bookingPage.back')}</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-gold py-3 rounded disabled:opacity-60 inline-flex items-center justify-center gap-2">
                <ShoppingCart size={17} />
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
            <p className="text-slate-500 mb-6">
              {locale === 'vi'
                ? `${bookingResults.length} đơn đặt phòng đã được tạo và gộp vào một hóa đơn.`
                : `${bookingResults.length} bookings were created and combined into one invoice.`}
            </p>
            <div className="mb-6 space-y-3 text-left">
              {bookingResults.map((result) => (
                <div key={result.id} className="rounded border border-stone-200 bg-stone-50 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p><span className="text-slate-500">{t('bookingPage.bookingId')}:</span> <strong>#{result.id}</strong></p>
                      <p><strong>{result.roomTypeName}</strong> × {result.quantity}</p>
                      <p className="text-slate-500">{result.checkInDate?.split('T')[0]} - {result.checkOutDate?.split('T')[0]}</p>
                      <p className="font-bold text-[#bfa15f]">{formatPrice(Number(result.totalPrice), locale)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-5 flex items-center justify-center gap-2 text-amber-700">
              <Clock size={18} />
              <strong>{locale === 'vi' ? 'Phòng được giữ trong' : 'Room held for'} {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}</strong>
            </div>
            <div className="mb-5 rounded-xl border border-[#bfa15f]/30 bg-[#bfa15f]/10 p-5">
              <p className="text-sm font-semibold text-slate-600">{locale === 'vi' ? 'Tổng tiền cần thanh toán' : 'Total amount due'}</p>
              <p className="mt-1 text-3xl font-bold text-[#bfa15f]">{formatPrice(combinedInvoiceTotal, locale)}</p>
            </div>
            <Link
              to={`/invoice/batch?${bookingResults.map((result) => `bookingIds=${result.id}`).join('&')}${isReceptionist ? '&receptionistPayment=true' : ''}`}
              className="btn-gold inline-block rounded px-8 py-3"
            >
              {isReceptionist
                ? (locale === 'vi' ? 'Chọn hình thức thanh toán' : 'Choose payment method')
                : (locale === 'vi' ? 'Tiếp tục thanh toán' : 'Continue to payment')}
            </Link>
          </div>
        )}
        </section>

        {step < 3 && (
          <aside className="sticky top-5 rounded-md border border-stone-200 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800">{locale === 'vi' ? 'Thông tin đặt phòng' : 'Booking information'}</h2>
            <div className="my-4 border-t border-stone-200" />
            <p className="font-bold text-slate-800">HMS Luxury Hotel</p>

            <div className="my-5 border-t border-dashed border-stone-300" />
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{locale === 'vi' ? `Giỏ phòng (${cartItems.length})` : `Room cart (${cartItems.length})`}</h3>
            </div>

            <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {cartItems.length > 0 ? cartItems.map((item) => (
                <div key={item.key} className="rounded border border-stone-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{item.roomTypeName} × {item.quantity}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.checkIn} - {item.checkOut} ({nightsBetween(item.checkIn, item.checkOut)} {locale === 'vi' ? 'đêm' : 'nights'})
                      </p>
                      <p className="mt-2 text-sm font-bold text-[#bfa15f]">
                        {formatPrice(Number(item.pricePerNight) * nightsBetween(item.checkIn, item.checkOut) * item.quantity, locale)}
                      </p>
                    </div>
                    {step === 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(item.key)}
                        className="text-slate-400 transition-colors hover:text-red-500"
                        title={locale === 'vi' ? 'Xóa khỏi giỏ' : 'Remove from cart'}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="rounded border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-slate-500">
                  <ShoppingCart size={24} className="mx-auto mb-2 text-stone-400" />
                  {locale === 'vi' ? 'Giỏ hàng chưa có phòng' : 'Your cart is empty'}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between text-lg font-bold">
              <span>{locale === 'vi' ? 'Tổng cộng' : 'Total'}</span>
              <span className="text-[#f2a900]">{formatPrice(cartTotal, locale)}</span>
            </div>
            {cartItems.length > 0 && (
              <div className={`mt-3 flex items-center justify-center gap-2 rounded border px-3 py-2 text-xs font-semibold ${cartHoldToken && remainingSeconds <= 60 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                <Clock size={15} />
                {cartHoldToken && holdExpiresAt
                  ? `${locale === 'vi' ? 'Đang giữ phòng' : 'Rooms held'} ${formatHoldCountdown(remainingSeconds)}`
                  : (locale === 'vi' ? 'Chưa giữ phòng trên máy chủ' : 'Rooms are not held on the server')}
              </div>
            )}
            <button
              type="button"
              onClick={handleCartAction}
              disabled={loading || cartItems.length === 0}
              className="mt-4 w-full rounded bg-[#f2a900] py-3 text-lg font-bold text-white transition hover:bg-[#d89500] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '...' : (step === 1
                ? (locale === 'vi' ? 'TIẾP TỤC' : 'CONTINUE')
                : (locale === 'vi' ? 'ĐẶT NGAY' : 'BOOK NOW'))}
            </button>
            {step === 1 && cartItems.length > 0 && (
              <Link to="/#room-types" className="mt-3 block text-center text-sm font-semibold text-[#bfa15f] hover:text-[#a3854a]">
                {locale === 'vi' ? '+ Đặt thêm loại phòng khác' : '+ Add another room type'}
              </Link>
            )}
            <p className="mt-3 text-center text-xs text-slate-500">{locale === 'vi' ? `Phòng được giữ ${BOOKING_HOLD_MINUTES} phút sau khi thêm vào giỏ.` : `Rooms are held for ${BOOKING_HOLD_MINUTES} minutes after being added to the cart.`}</p>
          </aside>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return <BookingContent />;
}

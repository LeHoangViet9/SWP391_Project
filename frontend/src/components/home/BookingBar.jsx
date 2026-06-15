import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Calendar, Users, Tag } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { hotels } from '../../data/mockData';
import { getAvailableRooms } from '../../services/roomService';

const today = () => new Date().toISOString().split('T')[0];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export default function BookingBar() {
  const { t, locale, acceptLanguage } = useLocale();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    hotelId: '',
    checkIn: today(),
    checkOut: tomorrow(),
    rooms: 1,
    adults: 2,
    children: 0,
    promoCode: '',
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSearch = async () => {
    const payload = {
      hotelId: form.hotelId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      rooms: form.rooms,
      adults: form.adults,
      children: form.children,
      promoCode: form.promoCode,
      acceptLanguage,
    };

    console.log('[BookingBar] Search payload:', payload);
    console.log('[BookingBar] API → GET /api/v1/rooms/available', payload);

    setLoading(true);
    try {
      const response = await getAvailableRooms(
        {
          page: 0,
          size: 10,
          hotelId: form.hotelId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          adults: form.adults,
          children: form.children,
          promoCode: form.promoCode,
        },
        locale
      );
      console.log('[BookingBar] API Response:', response);
    } catch (err) {
      console.warn('[BookingBar] API call failed (expected if backend offline):', err.message);
    } finally {
      setLoading(false);
      navigate(
        `/booking?checkIn=${form.checkIn}&checkOut=${form.checkOut}&quantity=${form.rooms}`
      );
    }
  };

  return (
    <div className="bg-white shadow-2xl border border-stone-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-0">
        {/* Destination */}
        <div className="lg:col-span-3 p-4 border-b md:border-b-0 md:border-r border-stone-200">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            <Building2 size={14} />
            {t('booking.destination')}
          </label>
          <select
            value={form.hotelId}
            onChange={(e) => update('hotelId', e.target.value)}
            className="w-full text-slate-800 font-medium bg-transparent outline-none cursor-pointer"
          >
            <option value="">{t('booking.selectHotel')}</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Check-in */}
        <div className="lg:col-span-2 p-4 border-b md:border-b-0 md:border-r border-stone-200">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            <Calendar size={14} />
            {t('booking.checkIn')}
          </label>
          <input
            type="date"
            value={form.checkIn}
            min={today()}
            onChange={(e) => update('checkIn', e.target.value)}
            className="w-full text-slate-800 font-medium bg-transparent outline-none"
          />
        </div>

        {/* Check-out */}
        <div className="lg:col-span-2 p-4 border-b md:border-b-0 md:border-r border-stone-200">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            <Calendar size={14} />
            {t('booking.checkOut')}
          </label>
          <input
            type="date"
            value={form.checkOut}
            min={form.checkIn || today()}
            onChange={(e) => update('checkOut', e.target.value)}
            className="w-full text-slate-800 font-medium bg-transparent outline-none"
          />
        </div>

        {/* Guests */}
        <div className="lg:col-span-3 p-4 border-b md:border-b-0 md:border-r border-stone-200">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
            <Users size={14} />
            Khách & Phòng
          </label>
          <div className="flex items-center gap-2 xl:gap-2.5">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => update('rooms', Math.max(1, form.rooms - 1))}
                className="w-6 h-6 border border-stone-300 rounded text-slate-600 hover:border-[#bfa15f] flex items-center justify-center font-bold text-xs"
              >
                −
              </button>
              <span className="w-4 text-center font-bold text-xs">{form.rooms}</span>
              <button
                type="button"
                onClick={() => update('rooms', form.rooms + 1)}
                className="w-6 h-6 border border-stone-300 rounded text-slate-600 hover:border-[#bfa15f] flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
              <span className="text-[10px] text-slate-500 ml-0.5">Phòng</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => update('adults', Math.max(1, form.adults - 1))}
                className="w-6 h-6 border border-stone-300 rounded text-slate-600 hover:border-[#bfa15f] flex items-center justify-center font-bold text-xs"
              >
                −
              </button>
              <span className="w-4 text-center font-bold text-xs">{form.adults}</span>
              <button
                type="button"
                onClick={() => update('adults', form.adults + 1)}
                className="w-6 h-6 border border-stone-300 rounded text-slate-600 hover:border-[#bfa15f] flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
              <span className="text-[10px] text-slate-500 ml-0.5">Lớn</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => update('children', Math.max(0, form.children - 1))}
                className="w-6 h-6 border border-stone-300 rounded text-slate-600 hover:border-[#bfa15f] flex items-center justify-center font-bold text-xs"
              >
                −
              </button>
              <span className="w-4 text-center font-bold text-xs">{form.children}</span>
              <button
                type="button"
                onClick={() => update('children', form.children + 1)}
                className="w-6 h-6 border border-stone-300 rounded text-slate-600 hover:border-[#bfa15f] flex items-center justify-center font-bold text-xs"
              >
                +
              </button>
              <span className="text-[10px] text-slate-500 ml-0.5">Trẻ</span>
            </div>
          </div>
        </div>

        {/* Promo + Search */}
        <div className="lg:col-span-2 p-4 flex flex-col justify-between">
          <div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              <Tag size={14} />
              {t('booking.promoCode')}
            </label>
            <input
              type="text"
              value={form.promoCode}
              onChange={(e) => update('promoCode', e.target.value)}
              placeholder={t('booking.promoPlaceholder')}
              className="w-full text-slate-800 bg-transparent outline-none placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full btn-gold py-4 text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Search size={18} />
        {loading ? '...' : t('booking.search')}
      </button>
    </div>
  );
}

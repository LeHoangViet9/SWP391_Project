import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Search, Users } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export default function BookingBar({ onSearchGuests }) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getLocalDateString = (dateObj = new Date()) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = () => getLocalDateString();
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
  };

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || today());
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || tomorrow());
  const [adults, setAdults] = useState(Number(searchParams.get('guests') || '2'));

  useEffect(() => {
    const qCheckIn = searchParams.get('checkIn');
    const qCheckOut = searchParams.get('checkOut');
    const qGuests = searchParams.get('guests');
    if (qCheckIn) setCheckIn(qCheckIn);
    if (qCheckOut) setCheckOut(qCheckOut);
    if (qGuests) setAdults(Number(qGuests));
  }, [searchParams]);

  const handleCheckInChange = (val) => {
    setCheckIn(val);
    const d1 = new Date(val);
    const d2 = new Date(checkOut);
    if (d2 <= d1) {
      const nextDay = new Date(d1);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(getLocalDateString(nextDay));
    }
  };

  const handleSearch = () => {
    if (onSearchGuests) {
      onSearchGuests({ checkIn, checkOut, guests: adults });
    }
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${adults}`);
  };

  return (
    <div className="bg-white shadow-2xl border border-stone-200 rounded-xl overflow-hidden max-w-5xl mx-auto p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
        {/* Check-in */}
        <div className="lg:col-span-3 p-4 hover:bg-stone-50/50 rounded-lg transition-colors border-b lg:border-b-0 lg:border-r border-stone-200">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-1.5">
            <Calendar size={14} />
            {t('booking.checkIn')}
          </label>
          <input
            type="date"
            value={checkIn}
            min={today()}
            onChange={(e) => handleCheckInChange(e.target.value)}
            className="w-full text-slate-800 font-medium bg-transparent outline-none cursor-pointer"
          />
        </div>

        {/* Check-out */}
        <div className="lg:col-span-3 p-4 hover:bg-stone-50/50 rounded-lg transition-colors border-b lg:border-b-0 lg:border-r border-stone-200">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-1.5">
            <Calendar size={14} />
            {t('booking.checkOut')}
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn ? (() => {
              const d = new Date(checkIn);
              d.setDate(d.getDate() + 1);
              return getLocalDateString(d);
            })() : today()}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full text-slate-800 font-medium bg-transparent outline-none cursor-pointer"
          />
        </div>

        {/* Guests */}
        <div className="lg:col-span-4 p-4 hover:bg-stone-50/50 rounded-lg transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b lg:border-b-0 lg:border-r border-stone-200">
          <div className="text-left">
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-1.5">
              <Users size={14} />
              {locale === 'vi' ? 'Số lượng khách' : 'Number of Guests'}
            </label>
            <span className="text-xs text-stone-400 block">
              {locale === 'vi' ? 'Tìm phòng phù hợp nhất' : 'Find the perfect fit'}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-lg p-1.5 px-3">
            <button
              type="button"
              onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 rounded-full border border-stone-300 hover:border-[#bfa15f] hover:text-[#bfa15f] flex items-center justify-center font-bold text-base transition-colors bg-white text-stone-600 shadow-sm"
            >
              −
            </button>
            <span className="w-6 text-center font-display text-lg font-bold text-stone-800">
              {adults}
            </span>
            <button
              type="button"
              onClick={() => setAdults((prev) => prev + 1)}
              className="w-7 h-7 rounded-full border border-stone-300 hover:border-[#bfa15f] hover:text-[#bfa15f] flex items-center justify-center font-bold text-base transition-colors bg-white text-stone-600 shadow-sm"
            >
              +
            </button>
            <span className="text-xs font-semibold text-[#bfa15f] uppercase ml-1">
              {locale === 'vi' ? 'Khách' : adults === 1 ? 'Guest' : 'Guests'}
            </span>
          </div>
        </div>

        {/* Search Button */}
        <div className="lg:col-span-2 p-2 w-full">
          <button
            onClick={handleSearch}
            className="w-full btn-gold py-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#bfa15f]/25 hover:shadow-lg transition-all"
          >
            <Search size={18} />
            {t('booking.search')}
          </button>
        </div>
      </div>
    </div>
  );
}

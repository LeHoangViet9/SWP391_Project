import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export default function BookingBar({ onSearchGuests }) {
  const { t, locale } = useLocale();
  const [adults, setAdults] = useState(2);

  const handleSearch = () => {
    if (onSearchGuests) {
      onSearchGuests(adults);
      // Smooth scroll to the room types section
      const el = document.getElementById('room-types');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="bg-white shadow-2xl border border-stone-200 rounded-lg overflow-hidden max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-0">
        {/* Guests Selector */}
        <div className="flex-1 w-full p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b md:border-b-0 md:border-r border-stone-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-[#bfa15f]">
              <Users size={24} />
            </div>
            <div className="text-left">
              <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold block mb-0.5">
                {locale === 'vi' ? 'Số lượng khách' : 'Number of Guests'}
              </span>
              <span className="text-xs text-stone-400 block">
                {locale === 'vi' ? 'Tìm phòng phù hợp nhất' : 'Find the perfect fit'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-lg p-2 px-4">
            <button
              type="button"
              onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 rounded-full border border-stone-300 hover:border-[#bfa15f] hover:text-[#bfa15f] flex items-center justify-center font-bold text-lg transition-colors bg-white text-stone-600"
            >
              −
            </button>
            <span className="w-8 text-center font-display text-xl font-bold text-stone-800">
              {adults}
            </span>
            <button
              type="button"
              onClick={() => setAdults((prev) => prev + 1)}
              className="w-8 h-8 rounded-full border border-stone-300 hover:border-[#bfa15f] hover:text-[#bfa15f] flex items-center justify-center font-bold text-lg transition-colors bg-white text-stone-600"
            >
              +
            </button>
            <span className="text-sm font-medium text-stone-500">
              {locale === 'vi' ? 'Khách' : adults === 1 ? 'Guest' : 'Guests'}
            </span>
          </div>
        </div>

        {/* Search Button */}
        <div className="w-full md:w-auto p-6 shrink-0">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto btn-gold px-8 py-4 text-sm md:text-base font-semibold flex items-center justify-center gap-2 rounded shadow-md shadow-[#bfa15f]/25 hover:shadow-lg transition-all"
          >
            <Search size={18} />
            {locale === 'vi' ? 'Tìm phòng' : 'Search Rooms'}
          </button>
        </div>
      </div>
    </div>
  );
}

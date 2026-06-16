import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wifi, Wind, Coffee, Bath, Star } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { roomTypes as mockRoomTypes } from '../../data/mockData';
import { getRoomTypes } from '../../services/roomService';

const amenityIcons = {
  Wifi: Wifi,
  'Điều hòa': Wind,
  'Ăn sáng': Coffee,
  'Bồn tắm': Bath,
};

function formatPrice(price, locale) {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function RoomTypesSection() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(mockRoomTypes);

  useEffect(() => {
    getRoomTypes({ page: 0, size: 10 }, locale)
      .then((res) => {
        if (res?.data?.content?.length) {
          const apiRooms = res.data.content.map((rt) => ({
            ...rt,
            basePrice: Number(rt.basePrice),
            imageUrl: mockRoomTypes.find((m) => m.id === rt.id)?.imageUrl
              || mockRoomTypes[0].imageUrl,
            amenities: mockRoomTypes.find((m) => m.id === rt.id)?.amenities
              || ['Wifi', 'Điều hòa'],
          }));
          setRooms(apiRooms);
        }
      })
      .catch(() => {
        /* fallback to mock */
      });
  }, [locale]);

  const handleBook = (roomType) => {
    navigate(`/booking?roomTypeId=${roomType.id}`);
  };

  return (
    <section id="room-types" className="py-16 md:py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-2">{t('rooms.subtitle')}</p>
          <h2 className="section-title">{t('rooms.title')}</h2>
          <div className="w-20 h-0.5 bg-[#bfa15f] mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {rooms.map((room) => (
            <article
              key={room.id}
              className="bg-white border border-stone-200 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
            >
              <div className="relative h-56 md:h-64 overflow-hidden">
                <img
                  src={room.imageUrl}
                  alt={room.typeName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#bfa15f] text-white text-xs font-semibold px-3 py-1 uppercase tracking-wider">
                  {room.status === 'ACTIVE' ? '5★' : room.status}
                </div>
                {room.totalRooms === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-600 text-white font-bold text-sm px-4 py-2 uppercase tracking-widest rounded-sm">
                      {locale === 'vi' ? 'Hết phòng' : 'Sold Out'}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-display text-xl font-semibold text-slate-800">
                    {room.typeName}
                  </h3>
                  <div className="flex items-center gap-1 text-[#bfa15f] shrink-0">
                    <Users size={16} />
                    <span className="text-sm font-medium">
                      {room.maxGuests} {t('rooms.guests')}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">
                  {room.description}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {room.amenities?.map((a) => {
                    const Icon = amenityIcons[a] || Star;
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 text-xs bg-stone-100 text-slate-600 px-2.5 py-1 rounded"
                      >
                        <Icon size={12} className="text-[#bfa15f]" />
                        {a}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-end justify-between border-t border-stone-100 pt-4">
                  <div>
                    <span className="text-2xl font-bold text-[#bfa15f]">
                      {formatPrice(room.basePrice, locale)}
                    </span>
                    <span className="text-sm text-slate-500 ml-1">{t('rooms.perNight')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => console.log('[RoomTypes] View detail → GET /api/v1/room-types/' + room.id)}
                      className="px-4 py-2 text-sm border border-[#bfa15f] text-[#bfa15f] hover:bg-[#bfa15f] hover:text-white transition-colors font-medium"
                    >
                      {t('rooms.viewDetail')}
                    </button>
                    {room.totalRooms === 0 ? (
                      <button
                        disabled
                        className="px-4 py-2 text-sm bg-stone-300 text-stone-500 cursor-not-allowed rounded font-medium"
                      >
                        {locale === 'vi' ? 'Hết phòng' : 'Sold Out'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBook(room)}
                        className="px-4 py-2 text-sm btn-gold rounded font-medium"
                      >
                        {t('rooms.bookNow')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wifi, Wind, Coffee, Bath, Star, X, ShieldCheck, Sparkles, Car, Compass, Tv } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { roomTypes as mockRoomTypes } from '../../data/mockData';
import { getRoomTypes } from '../../services/roomService';
import { checkAvailability } from '../../services/bookingService';

const amenityIcons = {
  'Wifi': Wifi,
  'Điều hòa': Wind,
  'Ăn sáng': Coffee,
  'Bồn tắm': Bath,
  'Minibar': Tv,
  'Ban công': Compass,
  'Butler': ShieldCheck,
  'Lounge': Sparkles,
  'Jacuzzi': Sparkles,
  'Limousine': Car,
};

function formatPrice(price, locale) {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function isRoomUnavailable(room) {
  return room.availabilityError === true
    || Number(room.totalRooms ?? 0) <= 0
    || Number(room.availableCount ?? 0) <= 0;
}

export default function RoomTypesSection({ guestFilter = 0, checkIn = '', checkOut = '' }) {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(mockRoomTypes);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    getRoomTypes({ page: 0, size: 10 }, locale)
      .then(async (res) => {
        if (res?.data?.content?.length) {
          const apiRooms = await Promise.all(
            res.data.content.map(async (rt) => {
              let availableCount = Number(rt.totalRooms ?? 0);
              let availabilityError = false;
              if (checkIn && checkOut) {
                try {
                  const checkRes = await checkAvailability(
                    {
                      roomTypeId: rt.id,
                      checkInDate: checkIn.includes('T') ? checkIn : `${checkIn}T14:00:00`,
                      checkOutDate: checkOut.includes('T') ? checkOut : `${checkOut}T12:00:00`,
                    },
                    locale
                  );
                  const parsedCount = Number(checkRes?.data);
                  if (Number.isFinite(parsedCount)) {
                    availableCount = Math.max(0, Math.floor(parsedCount));
                  } else {
                    availabilityError = true;
                  }
                } catch (e) {
                  availabilityError = true;
                }
              }
              return {
                ...rt,
                availableCount,
                availabilityError,
                basePrice: Number(rt.basePrice),
                imageUrl: rt.imageUrl || rt.imageUrls?.[0] || mockRoomTypes.find((m) => m.id === rt.id)?.imageUrl || mockRoomTypes[0].imageUrl,
                amenities:
                  mockRoomTypes.find((m) => m.id === rt.id)?.amenities || ['Wifi', 'Điều hòa'],
              };
            })
          );
          setRooms(apiRooms);
        }
      })
      .catch(() => {
        /* fallback to mock */
      });
  }, [locale, checkIn, checkOut]);

  const handleBook = (roomType) => {
    let url = `/booking?roomTypeId=${roomType.id}`;
    if (checkIn) url += `&checkIn=${checkIn}`;
    if (checkOut) url += `&checkOut=${checkOut}`;
    navigate(url);
  };

  const filteredRooms = (() => {
    let list = rooms;
    if (guestFilter <= 0) return list;
    return list.filter((room) => Number(room.maxGuests) === guestFilter);
  })();

  return (
    <section id="room-types" className="py-16 md:py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-2">{t('rooms.subtitle')}</p>
          <h2 className="section-title">{t('rooms.title')}</h2>
          <div className="w-20 h-0.5 bg-[#bfa15f] mx-auto mt-4" />
        </div>

        {filteredRooms.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 shadow-md max-w-lg mx-auto rounded-lg px-6">
            <Users size={48} className="text-[#bfa15f] mx-auto mb-4 opacity-80 animate-pulse" />
            <h3 className="font-display text-lg font-bold text-slate-800 mb-2">
              {locale === 'vi' ? 'Không có phòng phù hợp' : 'No matching rooms'}
            </h3>
            <p className="text-slate-600 text-sm">
              {locale === 'vi'
                ? `Không có hạng phòng nào của chúng tôi hỗ trợ tối đa ${guestFilter} khách. Vui lòng chọn số lượng khách ít hơn hoặc chia thành nhiều phòng.`
                : `None of our room categories support up to ${guestFilter} guests. Please select fewer guests or split your group into multiple rooms.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {filteredRooms.map((room) => {
              const availabilityUnavailable = isRoomUnavailable(room);

              return (
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
                    {availabilityUnavailable && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold text-sm px-4 py-2 uppercase tracking-widest rounded-sm">
                          {room.availabilityError
                            ? (locale === 'vi' ? 'Không thể kiểm tra' : 'Availability unavailable')
                            : (locale === 'vi' ? 'Hết phòng' : 'Sold Out')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-slate-800">
                          {room.typeName}
                        </h3>
                        {room.reviewCount > 0 ? (
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                            <Star size={11} fill="#f59e0b" className="text-amber-500" />
                            <span>{room.averageRating}</span>
                            <span className="text-slate-400 font-normal">({room.reviewCount} {locale === 'vi' ? 'đánh giá' : 'reviews'})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 font-medium text-[10px] mt-1 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/50 w-fit">
                            <Star size={11} className="text-slate-300" />
                            <span>{locale === 'vi' ? 'Chưa có đánh giá' : 'No reviews'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[#bfa15f] shrink-0 mt-1">
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
                          onClick={() => setSelectedRoom(room)}
                          className="px-4 py-2 text-sm border border-[#bfa15f] text-[#bfa15f] hover:bg-[#bfa15f] hover:text-white transition-colors font-medium"
                        >
                          {t('rooms.viewDetail')}
                        </button>
                        {availabilityUnavailable ? (
                          <button
                            disabled
                            className="px-4 py-2 text-sm bg-stone-300 text-stone-500 cursor-not-allowed rounded font-medium"
                          >
                            {room.availabilityError
                              ? (locale === 'vi' ? 'Không thể kiểm tra' : 'Unavailable')
                              : (locale === 'vi' ? 'Hết phòng' : 'Sold Out')}
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
              );
            })}
          </div>
        )}
      </div>

      {/* Premium Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setSelectedRoom(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-slate-800 hover:text-[#bfa15f] p-2 rounded-full shadow-md transition-all duration-200"
            >
              <X size={18} />
            </button>

            {/* Room Image with overlay */}
            <div className="h-60 sm:h-72 w-full overflow-hidden relative shrink-0">
              <img
                src={selectedRoom.imageUrl}
                alt={selectedRoom.typeName}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-6 pt-16">
                <span className="text-white/95 text-[10px] font-bold uppercase tracking-widest bg-[#bfa15f] px-2.5 py-0.5 rounded-sm inline-block">
                  Luxury 5★
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2">
                  {selectedRoom.typeName}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Description */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[#bfa15f] font-bold mb-2">
                  {locale === 'vi' ? 'Mô tả hạng phòng' : 'Room Category Description'}
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedRoom.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 border border-stone-200/50 rounded-md">
                <div>
                  <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                    {locale === 'vi' ? 'Sức chứa tối đa' : 'Maximum Capacity'}
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-1 text-sm">
                    <Users size={16} className="text-[#bfa15f]" />
                    {selectedRoom.maxGuests} {t('rooms.guests')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                    {locale === 'vi' ? 'Đánh giá từ khách' : 'Guest Rating'}
                  </span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-1 text-sm">
                    <Star size={16} fill={selectedRoom.reviewCount > 0 ? "#f59e0b" : "none"} className={selectedRoom.reviewCount > 0 ? "text-amber-500" : "text-slate-300"} />
                    {selectedRoom.reviewCount > 0 ? (
                      <span>
                        {selectedRoom.averageRating} <span className="text-xs text-slate-500 font-normal">({selectedRoom.reviewCount} {locale === 'vi' ? 'đánh giá' : 'reviews'})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-normal">
                        {locale === 'vi' ? 'Chưa có' : 'None yet'}
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">
                    {locale === 'vi' ? 'Giá phòng tiêu chuẩn' : 'Standard Rate'}
                  </span>
                  <span className="font-semibold text-slate-800 block mt-1 text-sm">
                    <span className="text-[#bfa15f] font-bold text-base">
                      {formatPrice(selectedRoom.basePrice, locale)}
                    </span>
                    <span className="text-xs text-slate-500 font-normal ml-0.5">
                      {t('rooms.perNight')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-[#bfa15f] font-bold mb-3">
                  {t('rooms.amenities')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedRoom.amenities?.map((a) => {
                    const Icon = amenityIcons[a] || Star;
                    return (
                      <div
                        key={a}
                        className="flex items-center gap-2 text-xs bg-stone-100/70 border border-stone-200/20 text-slate-700 px-3 py-2 rounded-md hover:bg-stone-100 transition-colors"
                      >
                        <Icon size={14} className="text-[#bfa15f] shrink-0" />
                        <span className="font-medium">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="px-5 py-2.5 text-xs border border-stone-300 text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors font-medium rounded-sm uppercase tracking-wider"
                >
                  {locale === 'vi' ? 'Đóng' : 'Close'}
                </button>
                {isRoomUnavailable(selectedRoom) ? (
                  <button
                    disabled
                    className="px-6 py-2.5 text-xs bg-stone-300 text-stone-500 cursor-not-allowed font-medium rounded-sm uppercase tracking-wider"
                  >
                    {selectedRoom.availabilityError
                      ? (locale === 'vi' ? 'Không thể kiểm tra' : 'Unavailable')
                      : (locale === 'vi' ? 'Hết phòng' : 'Sold Out')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedRoom(null);
                      handleBook(selectedRoom);
                    }}
                    className="px-6 py-2.5 text-xs btn-gold font-medium rounded-sm shadow-md shadow-[#bfa15f]/15 hover:shadow-lg transition-all duration-200 uppercase tracking-wider"
                  >
                    {t('rooms.bookNow')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

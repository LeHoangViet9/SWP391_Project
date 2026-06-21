import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wifi, Wind, Coffee, Bath, Star, X, Wrench } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { roomTypes as mockRoomTypes } from '../../data/mockData';
import { getRoomTypes, getRoomsByRoomType } from '../../services/roomService';
import { equipmentService } from '../../services/equipmentService';

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

function getEquipmentImageUrl(item) {
  const imageUrl =
    item?.images?.find((img) => img.isPrimary)?.imageUrl ||
    item?.images?.[0]?.imageUrl;

  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;

  return `http://localhost:9999${imageUrl}`;
}

export default function RoomTypesSection() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(mockRoomTypes);

  // Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomEquipments, setRoomEquipments] = useState([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);

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

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedRoom(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedRoom) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedRoom]);

  const handleBook = (roomType) => {
    navigate(`/booking?roomTypeId=${roomType.id}`);
  };

  const handleViewDetails = async (roomType) => {
    setSelectedRoom(roomType);
    setRoomEquipments([]);
    setLoadingEquipments(true);

    try {
      // 1. Get rooms of this room type
      const roomsRes = await getRoomsByRoomType(roomType.id, { page: 0, size: 50 }, locale);
      const roomsList = roomsRes?.data?.content || roomsRes?.data || [];

      if (roomsList.length > 0) {
        // 2. Get equipments of the first room
        const roomId = roomsList[0].id;
        const equipRes = await equipmentService.getByRoom(roomId, locale);
        const equipList = equipRes?.data || [];

        // 3. Fetch full equipment details to get description and images
        const enrichedList = await Promise.all(
          equipList.map(async (item) => {
            try {
              const detailRes = await equipmentService.getById(item.equipmentId, locale);
              return {
                ...item,
                description: detailRes?.data?.description,
                images: detailRes?.data?.images || [],
              };
            } catch {
              return item;
            }
          })
        );
        setRoomEquipments(enrichedList);
      }
    } catch (err) {
      console.error('Error loading room equipments:', err);
    } finally {
      setLoadingEquipments(false);
    }
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
                      onClick={() => handleViewDetails(room)}
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

      {/* GORGEOUS PREMIUM DETAIL MODAL */}
      {selectedRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative max-h-[90vh] transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Column (Image & Cover Title) */}
            <div className="md:w-1/2 relative h-64 md:h-auto bg-stone-100 shrink-0">
              <img
                src={selectedRoom.imageUrl}
                alt={selectedRoom.typeName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <span className="bg-[#bfa15f] text-white text-xs font-semibold px-3 py-1 uppercase tracking-wider rounded-sm mb-2 inline-block">
                  {selectedRoom.status === 'ACTIVE' ? '5★ LUXURY' : selectedRoom.status}
                </span>
                <h3 className="font-display text-2xl font-bold">{selectedRoom.typeName}</h3>
              </div>
            </div>

            {/* Right Column (Scrollable details & Equipments) */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-start mb-4 shrink-0">
                <div>
                  <div className="text-2xl font-bold text-[#bfa15f]">
                    {formatPrice(selectedRoom.basePrice, locale)}
                    <span className="text-xs text-slate-500 font-normal ml-1">{t('rooms.perNight')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 mt-1">
                    <Users size={14} />
                    <span className="text-xs">
                      {selectedRoom.maxGuests} {t('rooms.guests')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable body content */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 my-2">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Mô tả hạng phòng
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedRoom.description}
                  </p>
                </div>

                {/* Basic Amenities */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Tiện nghi cơ bản
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.amenities?.map((a) => {
                      const Icon = amenityIcons[a] || Star;
                      return (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 text-xs bg-stone-50 border border-stone-200 text-slate-600 px-3 py-1.5 rounded-full"
                        >
                          <Icon size={12} className="text-[#bfa15f]" />
                          {a}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Room Equipments */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Thiết bị trong phòng
                  </h4>
                  {loadingEquipments ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
                      <div className="w-4 h-4 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin" />
                      Đang tải danh sách thiết bị...
                    </div>
                  ) : roomEquipments.length === 0 ? (
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center">
                      <span className="text-xs text-slate-500">
                        Chưa có thông tin thiết bị được thiết lập cho phòng này.
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roomEquipments.map((item) => {
                        const imageUrl = getEquipmentImageUrl(item);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-lg"
                          >
                            <div className="w-12 h-12 rounded border border-stone-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.equipmentName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Wrench size={16} className="text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 font-sans">
                              <div
                                className="text-xs font-semibold text-slate-800 truncate"
                                title={item.equipmentName}
                              >
                                {item.equipmentName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {item.equipmentCode}
                              </div>
                              {item.description && (
                                <div
                                  className="text-[10px] text-slate-500 truncate"
                                  title={item.description}
                                >
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-bold text-[#bfa15f] bg-[#bfa15f]/10 px-2 py-1 rounded shrink-0">
                              x{item.quantity}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-stone-100 pt-4 mt-4 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="px-5 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50 text-slate-600 transition-colors font-medium"
                >
                  Đóng
                </button>
                {selectedRoom.totalRooms === 0 ? (
                  <button
                    disabled
                    className="px-5 py-2 text-sm bg-stone-300 text-stone-500 cursor-not-allowed rounded font-medium"
                  >
                    {locale === 'vi' ? 'Hết phòng' : 'Sold Out'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedRoom(null);
                      handleBook(selectedRoom);
                    }}
                    className="px-5 py-2 text-sm btn-gold rounded font-medium"
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

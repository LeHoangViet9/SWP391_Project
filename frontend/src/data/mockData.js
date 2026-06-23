/**
 * Mock data aligned with Spring Boot DTOs:
 * - RoomTypeResponse: id, typeName, description, basePrice, maxGuests, status
 * - RoomResponse: id, roomNumber, roomType, roomStatus, floorNumber, description, imageRoom
 * Extended with imageUrl & amenities for UI display.
 */

export const hotels = [
  { id: 1, name: 'HMS Luxury Hà Nội', city: 'Hà Nội', region: 'Miền Bắc' },
  { id: 2, name: 'HMS Luxury Đà Nẵng', city: 'Đà Nẵng', region: 'Miền Trung' },
  { id: 3, name: 'HMS Luxury Nha Trang', city: 'Nha Trang', region: 'Miền Trung' },
  { id: 4, name: 'HMS Luxury TP.HCM', city: 'TP. Hồ Chí Minh', region: 'Miền Nam' },
  { id: 5, name: 'HMS Luxury Phú Quốc', city: 'Phú Quốc', region: 'Miền Nam' },
];

export const heroSlides = [
  {
    id: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
    titleVi: 'Sảnh đón khách hoàng gia',
    titleEn: 'Grand Royal Lobby',
  },
  {
    id: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&q=80',
    titleVi: 'King Suite tầm nhìn panorama',
    titleEn: 'King Suite Panoramic View',
  },
  {
    id: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1920&q=80',
    titleVi: 'Không gian nghỉ dưỡng tinh tế',
    titleEn: 'Refined Retreat Space',
  },
  {
    id: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80',
    titleVi: 'Tiện ích 5 sao đẳng cấp',
    titleEn: 'World-Class 5-Star Amenities',
  },
];

/** Matches RoomTypeResponse + UI extensions */
export const roomTypes = [
  {
    id: 5,
    typeName: 'Standard Single Room',
    description:
      'Phòng 22m² với giường đơn ấm cúng, thiết kế hiện đại, đầy đủ tiện nghi, lý tưởng cho khách du lịch một mình hoặc công tác.',
    basePrice: 950000,
    maxGuests: 1,
    status: 'ACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',
    amenities: ['Wifi', 'Điều hòa', 'Tivi', 'Minibar'],
  },
  {
    id: 1,
    typeName: 'Superior Room',
    description:
      'Phòng 32m² với giường King, cửa sổ hướng thành phố, nội thất gỗ óc chó sang trọng và minibar cao cấp.',
    basePrice: 1850000,
    maxGuests: 2,
    status: 'ACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    amenities: ['Wifi', 'Điều hòa', 'Minibar', 'Bồn tắm'],
  },
  {
    id: 2,
    typeName: 'Deluxe Room',
    description:
      'Phòng 40m² với ban công riêng, bồn tắm đứng kính, trang bị đầy đủ tiện nghi cao cấp cho cặp đôi.',
    basePrice: 2450000,
    maxGuests: 2,
    status: 'ACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    amenities: ['Wifi', 'Điều hòa', 'Ban công', 'Bồn tắm', 'Ăn sáng'],
  },
  {
    id: 3,
    typeName: 'Executive Suite',
    description:
      'Suite 65m² gồm phòng khách riêng, bàn làm việc, quyền lợi Executive Lounge và dịch vụ butler 24/7.',
    basePrice: 4200000,
    maxGuests: 3,
    status: 'ACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    amenities: ['Wifi', 'Điều hòa', 'Butler', 'Bồn tắm', 'Ăn sáng', 'Lounge'],
  },
  {
    id: 4,
    typeName: 'Presidential Suite',
    description:
      'Suite tổng thống 120m² với phòng ngủ master, phòng ăn riêng, jacuzzi và tầm nhìn toàn cảnh thành phố.',
    basePrice: 12500000,
    maxGuests: 4,
    status: 'ACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    amenities: ['Wifi', 'Điều hòa', 'Jacuzzi', 'Butler', 'Ăn sáng', 'Lounge', 'Limousine'],
  },
];

export const hotelServices = [
  {
    id: 1,
    key: 'convention',
    imageUrl:
      'https://images.unsplash.com/photo-1519167758481-83f29da8c2b2?w=800&q=80',
    reverse: false,
  },
  {
    id: 2,
    key: 'spa',
    imageUrl:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    reverse: true,
  },
  {
    id: 3,
    key: 'gym',
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    reverse: false,
  },
  {
    id: 4,
    key: 'pool',
    imageUrl:
      'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80',
    reverse: true,
  },
];

export const footerBranches = [
  { city: 'Hà Nội', phone: '024 3836 3636', address: '78 Thanh Nhàn, Hai Bà Trưng' },
  { city: 'Đà Nẵng', phone: '0236 3777 999', address: '962 Ngô Quyền, Sơn Trà' },
  { city: 'Nha Trang', phone: '0258 3522 999', address: '60 Trần Phú, Lộc Thọ' },
  { city: 'TP.HCM', phone: '028 3822 8888', address: '136 Lê Thánh Tôn, Quận 1' },
];

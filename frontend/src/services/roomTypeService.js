import { apiFormData } from './api';

function appendRoomTypeFields(formData, roomType) {
  formData.append('typeName', String(roomType.typeName ?? ''));
  formData.append('description', String(roomType.description ?? ''));
  formData.append('basePrice', String(roomType.basePrice ?? ''));
  formData.append('maxGuests', String(roomType.maxGuests ?? ''));
}

export function createRoomType(roomType, images = [], locale = 'vi') {
  const formData = new FormData();
  appendRoomTypeFields(formData, roomType);
  images.forEach((image) => formData.append('images', image));
  return apiFormData('/room-types', formData, locale, 'POST');
}

export function updateRoomType(id, roomType, images = [], locale = 'vi') {
  const formData = new FormData();
  appendRoomTypeFields(formData, roomType);
  images.forEach((image) => formData.append('images', image));
  return apiFormData(`/room-types/${id}`, formData, locale, 'PUT');
}

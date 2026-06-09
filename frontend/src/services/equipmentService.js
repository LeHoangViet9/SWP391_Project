import axiosClient, { buildQuery, postFormData } from './axiosClient';

export async function getEquipments(params = {}) {
  const res = await axiosClient.get(`/equipments${buildQuery(params)}`);
  return res.data;
}

export async function getEquipmentById(id) {
  const res = await axiosClient.get(`/equipments/${id}`);
  return res.data;
}

/**
 * POST /api/v1/equipments — multipart/form-data
 * Backend uses @ModelAttribute EquipmentCreateDTO + @RequestParam MultipartFile file
 */
export async function createEquipment(payload, file) {
  const formData = new FormData();
  if (payload.equipmentName) formData.append('equipmentName', payload.equipmentName);
  if (payload.equipmentCode) formData.append('equipmentCode', payload.equipmentCode);
  if (payload.location) formData.append('location', payload.location);
  if (payload.description) formData.append('description', payload.description);
  if (payload.roomId) formData.append('roomId', String(payload.roomId));
  if (file) formData.append('file', file);

  return postFormData('/equipments', formData, 'POST');
}

/**
 * PUT /api/v1/equipments/{id} — multipart/form-data
 * Backend uses @ModelAttribute EquipmentCreateDTO + @RequestParam MultipartFile file
 */
export async function updateEquipment(id, payload, file) {
  const formData = new FormData();
  if (payload.equipmentName) formData.append('equipmentName', payload.equipmentName);
  if (payload.equipmentCode) formData.append('equipmentCode', payload.equipmentCode);
  if (payload.location) formData.append('location', payload.location);
  if (payload.description != null) formData.append('description', payload.description);
  if (payload.roomId) formData.append('roomId', String(payload.roomId));
  if (file) formData.append('file', file);

  return postFormData(`/equipments/${id}`, formData, 'PUT');
}

export async function deleteEquipment(id) {
  const res = await axiosClient.delete(`/equipments/${id}`);
  return res.data;
}

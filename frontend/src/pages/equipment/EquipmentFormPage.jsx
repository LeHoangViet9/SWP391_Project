import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Upload, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import {
  getEquipmentById,
  createEquipment,
  updateEquipment,
} from '../../services/equipmentService';
import { getAllRooms } from '../../services/roomService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EMPTY_FORM = {
  equipmentName: '',
  equipmentCode: '',
  location: '',
  description: '',
  roomId: '',
};

export default function EquipmentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useLocale();
  const { showToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { data: equipmentRes, isLoading: loadingEquipment } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id),
    enabled: isEdit,
  });

  const { data: roomsRes } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: () => getAllRooms({ size: 200 }),
  });

  const rooms = roomsRes?.data?.content || [];

  useEffect(() => {
    if (equipmentRes?.data) {
      const eq = equipmentRes.data;
      setForm({
        equipmentName: eq.equipmentName || '',
        equipmentCode: eq.equipmentCode || '',
        location: eq.location || '',
        description: eq.description || '',
        roomId: eq.roomId ? String(eq.roomId) : '',
      });
      const primary = eq.images?.find((img) => img.isPrimary) || eq.images?.[0];
      if (primary?.imageUrl) setImagePreview(primary.imageUrl);
    }
  }, [equipmentRes]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    const existing = equipmentRes?.data?.images?.find((img) => img.isPrimary) || equipmentRes?.data?.images?.[0];
    setImagePreview(existing?.imageUrl || null);
  };

  const mutation = useMutation({
    mutationFn: (params) =>
      isEdit
        ? updateEquipment(id, params.payload, params.file)
        : createEquipment(params.payload, params.file),
    onSuccess: (res) => {
      showToast(res.message || t('staff.common.saveSuccess'), 'success');
      navigate('/staff/equipments');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      equipmentName: form.equipmentName,
      equipmentCode: form.equipmentCode,
      location: form.location,
      description: form.description || undefined,
      roomId: form.roomId ? Number(form.roomId) : undefined,
    };
    mutation.mutate({ payload, file: imageFile });
  };

  if (isEdit && loadingEquipment) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl animate-fadeInUp">
      <Link
        to="/staff/equipments"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} />
        {t('bookingPage.back')}
      </Link>

      <h1 className="page-title mb-6">
        {isEdit ? t('staff.equipment.edit') : t('staff.equipment.add')}
      </h1>

      <form onSubmit={handleSubmit} className="hms-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="hms-label">{t('staff.equipment.name')} *</label>
            <input
              required
              value={form.equipmentName}
              onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
              className="hms-input"
            />
          </div>
          <div>
            <label className="hms-label">{t('staff.equipment.code')} *</label>
            <input
              required
              pattern="^[A-Za-z0-9\-]{2,30}$"
              value={form.equipmentCode}
              onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })}
              className="hms-input"
              placeholder="VD: AC-001"
            />
          </div>
          <div>
            <label className="hms-label">{t('staff.equipment.location')} *</label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="hms-input"
              placeholder="VD: Phòng 101"
            />
          </div>
          <div>
            <label className="hms-label">{t('staff.equipment.room')}</label>
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="hms-select"
            >
              <option value="">{t('staff.equipment.selectRoom')}</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} — {r.roomType?.typeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="hms-label">{t('staff.common.description')}</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="hms-input resize-none"
          />
        </div>

        <div>
          <label className="hms-label">{t('staff.equipment.image')}</label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-stone-200 rounded-lg cursor-pointer hover:border-[#bfa15f] text-sm text-slate-500 transition-colors">
              <Upload size={16} />
              {t('staff.equipment.uploadImage')}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            {imagePreview && (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-stone-200"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-gold px-6 py-2.5 rounded-lg flex items-center gap-2 text-sm disabled:opacity-60"
        >
          <Save size={16} />
          {mutation.isPending ? '...' : t('staff.common.save')}
        </button>
      </form>
    </div>
  );
}

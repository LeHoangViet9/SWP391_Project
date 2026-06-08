import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  createRoomType,
  updateRoomType,
  getRoomTypeById,
} from '../../services/roomTypeService';
import Alert from '../../components/common/Alert';

const emptyForm = {
  typeName: '',
  description: '',
  basePrice: '',
  maxGuests: '',
};

export default function RoomTypeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';
  const navigate = useNavigate();
  const { locale } = useLocale();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await getRoomTypeById(id, locale);
        if (cancelled) return;
        const rt = res?.data;
        setForm({
          typeName: rt.typeName || '',
          description: rt.description || '',
          basePrice: String(rt.basePrice || ''),
          maxGuests: String(rt.maxGuests || ''),
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải loại phòng');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isEdit, locale]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      typeName: form.typeName,
      description: form.description || undefined,
      basePrice: Number(form.basePrice),
      maxGuests: Number(form.maxGuests),
    };
    try {
      if (isEdit) {
        await updateRoomType(id, payload, locale);
      } else {
        await createRoomType(payload, locale);
      }
      navigate('/admin/room-types');
    } catch (err) {
      setError(err.message || 'Không thể lưu loại phòng');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/admin/room-types"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">
        {isEdit ? `Sửa loại phòng #${id}` : 'Thêm loại phòng mới'}
      </h1>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Tên loại phòng *
          </label>
          <input
            type="text"
            required
            value={form.typeName}
            onChange={(e) => setForm({ ...form, typeName: e.target.value })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Giá cơ bản (VND) *
            </label>
            <input
              type="number"
              min={1}
              required
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Số khách tối đa *
            </label>
            <input
              type="number"
              min={1}
              required
              value={form.maxGuests}
              onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Mô tả
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 btn-gold px-6 py-2.5 rounded-lg text-sm disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </form>
    </div>
  );
}

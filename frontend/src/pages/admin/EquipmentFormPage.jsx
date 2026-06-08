import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  createEquipment,
  updateEquipment,
  findEquipmentById,
} from '../../services/equipmentService';
import Alert from '../../components/common/Alert';

const emptyForm = {
  equipmentName: '',
  equipmentCode: '',
  location: '',
  description: '',
  roomId: '',
};

export default function EquipmentFormPage() {
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
        const res = await findEquipmentById(id, locale);
        if (cancelled) return;
        const eq = res?.data;
        setForm({
          equipmentName: eq.equipmentName || '',
          equipmentCode: eq.equipmentCode || '',
          location: eq.location || '',
          description: eq.description || '',
          roomId: String(eq.roomId || ''),
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải thiết bị');
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
      equipmentName: form.equipmentName,
      equipmentCode: form.equipmentCode,
      location: form.location,
      description: form.description || undefined,
      roomId: form.roomId ? Number(form.roomId) : null,
    };
    try {
      if (isEdit) {
        await updateEquipment(id, payload, locale);
      } else {
        await createEquipment(payload, locale);
      }
      navigate('/admin/equipments');
    } catch (err) {
      setError(err.message || 'Không thể lưu thiết bị');
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
        to="/admin/equipments"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">
        {isEdit ? `Sửa thiết bị #${id}` : 'Thêm thiết bị mới'}
      </h1>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Tên thiết bị *
          </label>
          <input
            type="text"
            required
            value={form.equipmentName}
            onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Mã thiết bị *
            </label>
            <input
              type="text"
              required
              pattern="[A-Za-z0-9\-]{2,30}"
              value={form.equipmentCode}
              onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Vị trí *
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            ID Phòng (tuỳ chọn)
          </label>
          <input
            type="number"
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] max-w-[200px]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Mô tả
          </label>
          <textarea
            rows={3}
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

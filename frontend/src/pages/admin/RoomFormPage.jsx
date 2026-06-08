import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { createRoom, updateRoom, getRoomById } from '../../services/roomService';
import { getAllRoomTypes } from '../../services/roomTypeService';
import Alert from '../../components/common/Alert';

const emptyForm = {
  roomNumber: '',
  roomTypeId: '',
  floorNumber: '',
  description: '',
};

export default function RoomFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';
  const navigate = useNavigate();
  const { locale } = useLocale();

  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllRoomTypes({ page: 1, size: 100 }, locale)
      .then((res) => setRoomTypes(res?.data?.content || []))
      .catch(() => {});
  }, [locale]);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await getRoomById(id, locale);
        if (cancelled) return;
        const r = res?.data;
        setForm({
          roomNumber: r.roomNumber || '',
          roomTypeId: String(r.roomType?.id || ''),
          floorNumber: String(r.floorNumber || ''),
          description: r.description || '',
        });
        setPreview(r.imageRoom || '');
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải phòng');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isEdit, locale]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !file) {
      setError('Vui lòng chọn ảnh phòng');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      roomNumber: form.roomNumber,
      roomTypeId: Number(form.roomTypeId),
      floorNumber: Number(form.floorNumber),
      description: form.description || undefined,
    };
    try {
      if (isEdit) {
        await updateRoom(id, payload, file, locale);
      } else {
        await createRoom(payload, file, locale);
      }
      navigate('/admin/rooms');
    } catch (err) {
      setError(err.message || 'Không thể lưu phòng');
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
        to="/admin/rooms"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">
        {isEdit ? `Sửa phòng #${id}` : 'Thêm phòng mới'}
      </h1>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Số phòng *
            </label>
            <input
              type="text"
              required
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Loại phòng *
            </label>
            <select
              required
              value={form.roomTypeId}
              onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] bg-white"
            >
              <option value="">Chọn loại phòng</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.typeName}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Tầng *
          </label>
          <input
            type="number"
            min={1}
            required
            value={form.floorNumber}
            onChange={(e) => setForm({ ...form, floorNumber: e.target.value })}
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Ảnh phòng {!isEdit && '*'}
          </label>
          <div className="flex items-start gap-4">
            {preview && (
              <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
            )}
            <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#bfa15f] transition-colors">
              <Upload size={24} className="text-slate-400 mb-1" />
              <span className="text-xs text-slate-500">Chọn ảnh</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
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

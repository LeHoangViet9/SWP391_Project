import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  createCustomer,
  updateCustomer,
  getCustomerById,
} from '../../services/customerService';
import Alert from '../../components/common/Alert';
import { ID_TYPE } from '../../constants/enums';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  idType: 'CCCD',
  idNumberCard: '',
  nationality: 'Việt Nam',
};

export default function CustomerFormPage() {
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
        const res = await getCustomerById(id, locale);
        if (cancelled) return;
        const c = res?.data;
        setForm({
          fullName: c.fullName || '',
          email: c.email || '',
          phone: c.phone || '',
          idType: 'CCCD',
          idNumberCard: c.idCard || '',
          nationality: c.nationality || 'Việt Nam',
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải khách hàng');
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
    try {
      if (isEdit) {
        await updateCustomer(id, form, locale);
      } else {
        await createCustomer(form, locale);
      }
      navigate('/admin/customers');
    } catch (err) {
      setError(err.message || 'Không thể lưu khách hàng');
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
        to="/admin/customers"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">
        {isEdit ? `Sửa khách hàng #${id}` : 'Thêm khách hàng mới'}
      </h1>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Họ tên *
          </label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Điện thoại *
            </label>
            <input
              type="tel"
              required
              pattern="0[0-9]{9}"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0xxxxxxxxx"
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Loại giấy tờ *
            </label>
            <select
              required
              value={form.idType}
              onChange={(e) => setForm({ ...form, idType: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] bg-white"
            >
              {ID_TYPE.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Số giấy tờ *
            </label>
            <input
              type="text"
              required
              pattern="[A-Za-z0-9\-]{6,20}"
              value={form.idNumberCard}
              onChange={(e) => setForm({ ...form, idNumberCard: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Quốc tịch *
          </label>
          <input
            type="text"
            required
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
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

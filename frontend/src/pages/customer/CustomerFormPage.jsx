import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import {
  getCustomerById,
  createCustomer,
  updateCustomer,
} from '../../services/customerService';
import { ID_TYPES } from '../../utils/constants';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phone: '',
  idType: 'CCCD',
  idNumberCard: '',
  nationality: 'Việt Nam',
};

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerById(id, locale),
    enabled: isEdit,
  });

  useEffect(() => {
    if (data?.data) {
      const c = data.data;
      setForm({
        fullName: c.fullName || '',
        email: c.email || '',
        phone: c.phone || '',
        idType: 'CCCD',
        idNumberCard: c.idCard || '',
        nationality: c.nationality || 'Việt Nam',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? updateCustomer(id, payload, locale) : createCustomer(payload, locale),
    onSuccess: (res) => {
      showToast(res.message || t('staff.common.saveSuccess'), 'success');
      navigate('/staff/customers');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      idType: form.idType,
      idNumberCard: form.idNumberCard,
      nationality: form.nationality,
    });
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <Link
        to="/staff/customers"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} />
        {t('bookingPage.back')}
      </Link>

      <h1 className="font-display text-2xl font-bold text-slate-800 mb-6">
        {isEdit ? t('staff.customer.edit') : t('staff.customer.add')}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              {t('auth.fullName')} *
            </label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              {t('auth.phone')} *
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              {t('bookingPage.idType')}
            </label>
            <select
              value={form.idType}
              onChange={(e) => setForm({ ...form, idType: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            >
              {ID_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              {t('bookingPage.idNumber')}
            </label>
            <input
              value={form.idNumberCard}
              onChange={(e) => setForm({ ...form, idNumberCard: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-[#bfa15f] font-semibold mb-2">
              {t('bookingPage.nationality')}
            </label>
            <input
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              className="w-full border border-stone-300 px-4 py-2.5 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-gold px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {mutation.isPending ? '...' : t('staff.common.save')}
        </button>
      </form>
    </div>
  );
}

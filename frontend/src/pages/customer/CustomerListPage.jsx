import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import { getCustomers, deleteCustomer } from '../../services/customerService';
import { canDeleteCustomer } from '../../utils/roleAccess';
import { CUSTOMER_STATUS, PAGE_SIZE } from '../../utils/constants';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { formatDateTime } from '../../utils/formatters';

export default function CustomerListPage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const role = user?.roleName;

  const [page, setPage] = useState(0);
  const [keywords, setKeywords] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['customers', page, keywords, status],
    queryFn: () =>
      getCustomers(
        { page, size: PAGE_SIZE, keywords: keywords || undefined, status: status || undefined },
        locale
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCustomer(id, locale),
    onSuccess: (res) => {
      showToast(res.message || t('staff.customer.deleteSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteId(null);
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const pageData = data?.data;
  const items = pageData?.content || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setKeywords(searchInput);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">{t('staff.customer.title')}</h1>
          <p className="text-slate-500 text-sm">{t('staff.customer.subtitle')}</p>
        </div>
        <Link
          to="/staff/customers/create"
          className="btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm self-start"
        >
          <Plus size={16} />
          {t('staff.customer.add')}
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('staff.customer.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg outline-none focus:border-[#bfa15f]"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="border border-stone-200 rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="">{t('staff.common.allStatus')}</option>
            {Object.values(CUSTOMER_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="btn-gold px-6 py-2.5 rounded-lg text-sm">
            {t('booking.search')}
          </button>
        </form>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <p className="p-6 text-red-600 text-sm">{error.message}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('auth.fullName')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('auth.phone')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('staff.customer.idCard')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('bookingPage.status')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('staff.common.createdAt')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">{t('staff.common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        {t('staff.common.noData')}
                      </td>
                    </tr>
                  ) : (
                    items.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3">{c.id}</td>
                        <td className="px-4 py-3 font-medium">{c.fullName}</td>
                        <td className="px-4 py-3">{c.email}</td>
                        <td className="px-4 py-3">{c.phone}</td>
                        <td className="px-4 py-3">{c.idCard || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(c.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/staff/customers/${c.id}/edit`}
                              className="p-1.5 text-slate-500 hover:text-[#bfa15f] border border-stone-200 rounded"
                            >
                              <Pencil size={14} />
                            </Link>
                            {canDeleteCustomer(role) && (
                              <button
                                onClick={() => setDeleteId(c.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 border border-stone-200 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination
                page={pageData?.number ?? page}
                totalPages={pageData?.totalPages ?? 0}
                totalElements={pageData?.totalElements ?? 0}
                pageSize={pageData?.size ?? PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title={t('staff.customer.deleteTitle')}
        message={t('staff.customer.deleteConfirm')}
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}

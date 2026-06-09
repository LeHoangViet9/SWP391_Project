import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import { getEquipments, deleteEquipment } from '../../services/equipmentService';
import { canDeleteEquipment, canEditEquipment } from '../../utils/roleAccess';
import { EQUIPMENT_STATUS, PAGE_SIZE } from '../../utils/constants';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import SkeletonTable from '../../components/ui/SkeletonTable';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { formatDateTime } from '../../utils/formatters';

export default function EquipmentListPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const role = user?.roleName;

  const [page, setPage] = useState(0);
  const [keywords, setKeywords] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['equipments', page, keywords],
    queryFn: () =>
      getEquipments({ page, size: PAGE_SIZE, keywords: keywords || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: (res) => {
      showToast(res.message || t('staff.equipment.deleteSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      setDeleteId(null);
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const pageData = data?.data;
  let items = pageData?.content || [];
  if (statusFilter) {
    items = items.filter((e) => e.status === statusFilter);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setKeywords(searchInput);
  };

  return (
    <div className="animate-fadeInUp">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('staff.equipment.title')}</h1>
          <p className="page-subtitle">{t('staff.equipment.subtitle')}</p>
        </div>
        {canEditEquipment(role) && (
          <Link
            to="/staff/equipments/create"
            className="btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm self-start"
          >
            <Plus size={16} />
            {t('staff.equipment.add')}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="hms-card p-4 mb-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('staff.common.searchPlaceholder')}
              className="hms-input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="hms-select md:w-48"
          >
            <option value="">{t('staff.common.allStatus')}</option>
            {Object.values(EQUIPMENT_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="btn-gold px-6 py-2.5 rounded-lg text-sm">
            {t('booking.search')}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="hms-card overflow-hidden">
        {isLoading ? (
          <SkeletonTable columns={8} rows={5} />
        ) : isError ? (
          <p className="p-6 text-red-600 text-sm">{error.message}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="hms-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('staff.equipment.name')}</th>
                    <th>{t('staff.equipment.code')}</th>
                    <th>{t('staff.equipment.location')}</th>
                    <th>{t('staff.equipment.room')}</th>
                    <th>{t('bookingPage.status')}</th>
                    <th>{t('staff.common.createdAt')}</th>
                    <th className="text-right">{t('staff.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        {t('staff.common.noData')}
                      </td>
                    </tr>
                  ) : (
                    items.map((eq) => (
                      <tr key={eq.id}>
                        <td className="text-slate-400">{eq.id}</td>
                        <td className="font-medium">{eq.equipmentName}</td>
                        <td className="text-slate-500 font-mono text-xs">{eq.equipmentCode}</td>
                        <td>{eq.location}</td>
                        <td>{eq.roomNumber || '—'}</td>
                        <td><StatusBadge status={eq.status} /></td>
                        <td className="text-slate-500 text-xs">{formatDateTime(eq.createdAt)}</td>
                        <td>
                          <div className="flex justify-end gap-1.5">
                            <Link
                              to={`/staff/equipments/${eq.id}`}
                              className="p-1.5 text-slate-400 hover:text-[#bfa15f] border border-stone-200 rounded-md transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={14} />
                            </Link>
                            {canEditEquipment(role) && (
                              <Link
                                to={`/staff/equipments/${eq.id}/edit`}
                                className="p-1.5 text-slate-400 hover:text-[#bfa15f] border border-stone-200 rounded-md transition-colors"
                              >
                                <Pencil size={14} />
                              </Link>
                            )}
                            {canDeleteEquipment(role) && (
                              <button
                                onClick={() => setDeleteId(eq.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 rounded-md transition-colors"
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
        title={t('staff.equipment.deleteTitle')}
        message={t('staff.equipment.deleteConfirm')}
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}

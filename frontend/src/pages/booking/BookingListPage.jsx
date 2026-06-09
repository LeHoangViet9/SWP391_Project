import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import {
  getAllBookings,
  searchBookings,
  deleteBooking,
} from '../../services/bookingService';
import { getRoomTypes } from '../../services/roomService';
import { getCustomers } from '../../services/customerService';
import { canManageBookings } from '../../utils/roleAccess';
import { BOOKING_STATUS, PAGE_SIZE } from '../../utils/constants';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function BookingListPage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const role = user?.roleName;
  const canEdit = canManageBookings(role);

  const [page, setPage] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    customerId: '',
    roomTypeId: '',
    roomId: '',
  });
  const [deleteId, setDeleteId] = useState(null);

  const hasFilters = Object.values(filters).some(Boolean);

  const { data: roomTypesRes } = useQuery({
    queryKey: ['room-types-select'],
    queryFn: () => getRoomTypes({ size: 100 }, locale),
    enabled: advanced,
  });

  const { data: customersRes } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => getCustomers({ size: 100 }, locale),
    enabled: advanced,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bookings', page, filters, advanced],
    queryFn: () => {
      const params = { page, size: PAGE_SIZE };
      if (hasFilters) {
        return searchBookings({ ...params, ...filters }, locale);
      }
      return getAllBookings(params, locale);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBooking(id, locale),
    onSuccess: (res) => {
      showToast(res.message || t('staff.booking.deleteSuccess'), 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setDeleteId(null);
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const pageData = data?.data;
  const items = pageData?.content || [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">{t('staff.booking.title')}</h1>
          <p className="text-slate-500 text-sm">{t('staff.booking.subtitle')}</p>
        </div>
        {canEdit && (
          <Link
            to="/staff/bookings/create"
            className="btn-gold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm self-start"
          >
            <Plus size={16} />
            {t('staff.booking.add')}
          </Link>
        )}
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAdvanced(!advanced)}
            className="text-sm text-[#bfa15f] font-semibold flex items-center gap-1"
          >
            <Search size={14} />
            {t('staff.booking.advancedSearch')}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setFilters({ status: '', customerId: '', roomTypeId: '', roomId: '' }); setPage(0); }}
              className="text-xs text-slate-500 hover:text-red-500"
            >
              {t('staff.common.clearFilters')}
            </button>
          )}
        </div>

        {advanced && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
            <select
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(0); }}
              className="border border-stone-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">{t('staff.common.allStatus')}</option>
              {Object.values(BOOKING_STATUS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filters.customerId}
              onChange={(e) => { setFilters({ ...filters, customerId: e.target.value }); setPage(0); }}
              className="border border-stone-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">{t('staff.booking.allCustomers')}</option>
              {(customersRes?.data?.content || []).map((c) => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
            <select
              value={filters.roomTypeId}
              onChange={(e) => { setFilters({ ...filters, roomTypeId: e.target.value }); setPage(0); }}
              className="border border-stone-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">{t('staff.booking.allRoomTypes')}</option>
              {(roomTypesRes?.data?.content || []).map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.typeName}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder={t('staff.booking.roomId')}
              value={filters.roomId}
              onChange={(e) => { setFilters({ ...filters, roomId: e.target.value }); setPage(0); }}
              className="border border-stone-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
        )}
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
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('staff.booking.customer')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('bookingPage.roomType')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('booking.checkIn')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('booking.checkOut')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">{t('bookingPage.status')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">{t('bookingPage.total')}</th>
                    {canEdit && (
                      <th className="text-right px-4 py-3 font-semibold text-slate-600">{t('staff.common.actions')}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-slate-400">
                        {t('staff.common.noData')}
                      </td>
                    </tr>
                  ) : (
                    items.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/50">
                        <td className="px-4 py-3">{b.id}</td>
                        <td className="px-4 py-3">{b.customerName}</td>
                        <td className="px-4 py-3">{b.roomTypeName}</td>
                        <td className="px-4 py-3">{formatDate(b.checkInDate, locale)}</td>
                        <td className="px-4 py-3">{formatDate(b.checkOutDate, locale)}</td>
                        <td className="px-4 py-3"><StatusBadge status={b.bookingStatus} /></td>
                        <td className="px-4 py-3 text-right">{formatCurrency(b.totalPrice, locale)}</td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/staff/bookings/${b.id}/edit`}
                                className="p-1.5 text-slate-500 hover:text-[#bfa15f] border border-stone-200 rounded"
                              >
                                <Pencil size={14} />
                              </Link>
                              <button
                                onClick={() => setDeleteId(b.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 border border-stone-200 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
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
        title={t('staff.booking.deleteTitle')}
        message={t('staff.booking.deleteConfirm')}
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}

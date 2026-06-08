import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { searchBookings, deleteBooking } from '../../services/bookingService';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import PageHeader from '../../components/common/PageHeader';
import ListToolbar from '../../components/common/ListToolbar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { BOOKING_STATUS } from '../../constants/enums';
import { formatCurrency, formatDateTime } from '../../utils/format';

export default function BookingListPage() {
  const [keyword, setKeyword] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchFn = useCallback(
    (filters, locale) =>
      searchBookings(
        {
          status: filters.status || undefined,
          customerId: filters.customerId || undefined,
          roomTypeId: filters.roomTypeId || undefined,
          roomId: filters.roomId || undefined,
          page: filters.page,
          size: filters.size,
        },
        locale
      ),
    []
  );

  const {
    data,
    filters,
    pageInfo,
    loading,
    error,
    setFilter,
    setPage,
    reload,
  } = usePaginatedList(fetchFn, { status: '' });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await deleteBooking(deleteId);
      setActionSuccess('Đã xóa đặt phòng thành công');
      setDeleteId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Không thể xóa đặt phòng');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', className: 'w-16' },
    { key: 'customerName', title: 'Khách hàng' },
    { key: 'roomTypeName', title: 'Loại phòng' },
    {
      key: 'checkInDate',
      title: 'Check-in',
      render: (row) => formatDateTime(row.checkInDate),
    },
    {
      key: 'checkOutDate',
      title: 'Check-out',
      render: (row) => formatDateTime(row.checkOutDate),
    },
    { key: 'quantity', title: 'SL', className: 'w-12' },
    {
      key: 'totalPrice',
      title: 'Tổng tiền',
      render: (row) => formatCurrency(row.totalPrice),
    },
    {
      key: 'bookingStatus',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.bookingStatus} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'w-28',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/bookings/${row.id}`}
            className="p-1.5 text-slate-500 hover:text-[#bfa15f] rounded"
            title="Xem"
          >
            <Eye size={16} />
          </Link>
          <Link
            to={`/admin/bookings/${row.id}/edit`}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
            title="Sửa"
          >
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý đặt phòng"
        subtitle="Tìm kiếm nâng cao theo trạng thái, khách hàng, loại phòng"
        actionLabel="Tạo đặt phòng"
        actionTo="/admin/bookings/new"
      />

      <Alert type="error" message={error || actionError} onClose={() => setActionError('')} />
      <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <ListToolbar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={() => {}}
          filters={[
            {
              key: 'status',
              label: 'Trạng thái',
              value: filters.status || '',
              onChange: (v) => setFilter('status', v),
              options: BOOKING_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
            },
          ]}
          extra={
            <>
              <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID Khách
                </label>
                <input
                  type="number"
                  value={filters.customerId || ''}
                  onChange={(e) => setFilter('customerId', e.target.value)}
                  placeholder="Tất cả"
                  className="border border-stone-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[120px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID Loại phòng
                </label>
                <input
                  type="number"
                  value={filters.roomTypeId || ''}
                  onChange={(e) => setFilter('roomTypeId', e.target.value)}
                  placeholder="Tất cả"
                  className="border border-stone-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
                />
              </div>
            </>
          }
        />

        <DataTable columns={columns} data={data} loading={loading} />
        <Pagination
          page={filters.page}
          totalPages={pageInfo.totalPages}
          totalElements={pageInfo.totalElements}
          onPageChange={setPage}
        />
      </div>

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Bạn có chắc muốn xóa đặt phòng #{deleteId}?</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60"
          >
            {deleteLoading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

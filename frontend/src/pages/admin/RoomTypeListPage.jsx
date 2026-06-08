import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { getAllRoomTypes, deleteRoomType } from '../../services/roomTypeService';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import PageHeader from '../../components/common/PageHeader';
import ListToolbar from '../../components/common/ListToolbar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import FilterSelect from '../../components/common/FilterSelect';
import { SORT_FIELDS, SORT_DIRECTIONS } from '../../constants/enums';
import { formatCurrency } from '../../utils/format';

export default function RoomTypeListPage() {
  const { locale } = useLocale();
  const [keyword, setKeyword] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchFn = useCallback(
    (filters, loc) =>
      getAllRoomTypes(
        {
          keywords: filters.keywords || undefined,
          maxGuests: filters.maxGuests || undefined,
          page: filters.page,
          size: filters.size,
          sortBy: filters.sortBy || 'ID',
          direction: filters.direction || 'ASC',
        },
        loc
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
  } = usePaginatedList(fetchFn, {
    keywords: '',
    maxGuests: '',
    sortBy: 'ID',
    direction: 'ASC',
  });

  const handleSearch = (kw) => setFilter('keywords', kw);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await deleteRoomType(deleteId, locale);
      setActionSuccess('Đã vô hiệu hóa loại phòng');
      setDeleteId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Không thể xóa loại phòng');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', className: 'w-16' },
    { key: 'typeName', title: 'Tên loại' },
    {
      key: 'basePrice',
      title: 'Giá cơ bản',
      render: (row) => formatCurrency(row.basePrice),
    },
    { key: 'maxGuests', title: 'Số khách tối đa', className: 'w-28' },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs">{row.description || '—'}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/room-types/${row.id}/edit`}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
          >
            <Pencil size={16} />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 text-slate-500 hover:text-red-600 rounded"
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
        title="Quản lý loại phòng"
        subtitle="Tìm kiếm theo tên, lọc theo số khách tối đa"
        actionLabel="Thêm loại phòng"
        actionTo="/admin/room-types/new"
      />

      <Alert type="error" message={error || actionError} onClose={() => setActionError('')} />
      <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <ListToolbar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          filters={[
            {
              key: 'maxGuests',
              label: 'Số khách tối đa',
              value: filters.maxGuests || '',
              onChange: (v) => setFilter('maxGuests', v),
              options: [1, 2, 3, 4, 5, 6].map((n) => ({
                value: String(n),
                label: `${n} khách`,
              })),
            },
          ]}
          extra={
            <>
              <FilterSelect
                label="Sắp xếp"
                value={filters.sortBy || 'ID'}
                onChange={(v) => setFilter('sortBy', v)}
                options={SORT_FIELDS}
                allLabel="Mặc định"
              />
              <FilterSelect
                label="Thứ tự"
                value={filters.direction || 'ASC'}
                onChange={(v) => setFilter('direction', v)}
                options={SORT_DIRECTIONS}
                allLabel="ASC"
              />
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

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Xác nhận vô hiệu hóa">
        <p className="text-slate-600 mb-6">Loại phòng sẽ chuyển sang INACTIVE. Tiếp tục?</p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2 border rounded-lg text-sm">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60"
          >
            {deleteLoading ? 'Đang xử lý...' : 'Vô hiệu hóa'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

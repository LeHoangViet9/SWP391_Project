import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { getCustomers, deleteCustomer } from '../../services/customerService';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import PageHeader from '../../components/common/PageHeader';
import ListToolbar from '../../components/common/ListToolbar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import FilterSelect from '../../components/common/FilterSelect';
import { ACCOUNT_STATUS, SORT_FIELDS, SORT_DIRECTIONS } from '../../constants/enums';
import { formatDateTime } from '../../utils/format';

export default function CustomerListPage() {
  const { locale } = useLocale();
  const [keyword, setKeyword] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchFn = useCallback(
    (filters, loc) =>
      getCustomers(
        {
          keywords: filters.keywords || undefined,
          status: filters.status || undefined,
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
    status: '',
    sortBy: 'ID',
    direction: 'ASC',
  });

  const handleSearch = (kw) => setFilter('keywords', kw);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await deleteCustomer(deleteId, locale);
      setActionSuccess('Đã xóa khách hàng thành công');
      setDeleteId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Không thể xóa khách hàng');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', className: 'w-16' },
    { key: 'fullName', title: 'Họ tên' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Điện thoại' },
    { key: 'idCard', title: 'Giấy tờ' },
    { key: 'nationality', title: 'Quốc tịch' },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/customers/${row.id}/edit`}
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
        title="Quản lý khách hàng"
        subtitle="Tìm kiếm theo tên, email, số điện thoại"
        actionLabel="Thêm khách hàng"
        actionTo="/admin/customers/new"
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
              key: 'status',
              label: 'Trạng thái',
              value: filters.status || '',
              onChange: (v) => setFilter('status', v),
              options: ACCOUNT_STATUS.map((s) => ({
                value: s,
                label: s.replace(/_/g, ' '),
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

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Bạn có chắc muốn xóa khách hàng #{deleteId}?</p>
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
            {deleteLoading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

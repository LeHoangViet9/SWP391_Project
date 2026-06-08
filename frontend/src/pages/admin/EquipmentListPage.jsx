import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { getAllEquipments, deleteEquipment } from '../../services/equipmentService';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import PageHeader from '../../components/common/PageHeader';
import ListToolbar from '../../components/common/ListToolbar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import FilterSelect from '../../components/common/FilterSelect';
import { EQUIPMENT_STATUS, SORT_FIELDS, SORT_DIRECTIONS } from '../../constants/enums';
import { formatDateTime } from '../../utils/format';

export default function EquipmentListPage() {
  const { locale } = useLocale();
  const [keyword, setKeyword] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchFn = useCallback(
    (filters, loc) =>
      getAllEquipments(
        {
          keywords: filters.keywords || undefined,
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

  const filteredData = filters.status
    ? data.filter((item) => item.status === filters.status)
    : data;

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await deleteEquipment(deleteId, locale);
      setActionSuccess('Đã xóa thiết bị thành công');
      setDeleteId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Không thể xóa thiết bị');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', className: 'w-16' },
    { key: 'equipmentName', title: 'Tên thiết bị' },
    { key: 'equipmentCode', title: 'Mã' },
    { key: 'location', title: 'Vị trí' },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'roomNumber',
      title: 'Phòng',
      render: (row) => row.roomNumber || '—',
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
            to={`/admin/equipments/${row.id}/edit`}
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
        title="Quản lý thiết bị"
        subtitle="Tìm kiếm, sắp xếp và phân trang thiết bị"
        actionLabel="Thêm thiết bị"
        actionTo="/admin/equipments/new"
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
              options: EQUIPMENT_STATUS.map((s) => ({
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

        <DataTable columns={columns} data={filteredData} loading={loading} />
        <Pagination
          page={filters.page}
          totalPages={pageInfo.totalPages}
          totalElements={pageInfo.totalElements}
          onPageChange={setPage}
        />
      </div>

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Bạn có chắc muốn xóa thiết bị #{deleteId}?</p>
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

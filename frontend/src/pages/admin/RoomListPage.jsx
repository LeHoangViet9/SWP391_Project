import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import {
  getAllRooms,
  getRoomsByStatus,
  getRoomsByFloor,
  getRoomsByRoomType,
  deleteRoom,
} from '../../services/roomService';
import { getAllRoomTypes } from '../../services/roomTypeService';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import PageHeader from '../../components/common/PageHeader';
import ListToolbar from '../../components/common/ListToolbar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { ROOM_STATUS, SORT_FIELDS, SORT_DIRECTIONS } from '../../constants/enums';
import FilterSelect from '../../components/common/FilterSelect';

export default function RoomListPage() {
  const { locale } = useLocale();
  const [keyword, setKeyword] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    getAllRoomTypes({ page: 1, size: 100 }, locale)
      .then((res) => setRoomTypes(res?.data?.content || []))
      .catch(() => {});
  }, [locale]);

  const fetchFn = useCallback(
    async (filters, loc) => {
      const params = {
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy || 'ID',
        direction: filters.direction || 'ASC',
      };

      if (filters.status) {
        return getRoomsByStatus(filters.status, params, loc);
      }
      if (filters.floorNumber) {
        return getRoomsByFloor(filters.floorNumber, params, loc);
      }
      if (filters.roomTypeId) {
        return getRoomsByRoomType(filters.roomTypeId, params, loc);
      }

      return getAllRooms({ ...params, keywords: filters.keywords || undefined }, loc);
    },
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
    floorNumber: '',
    roomTypeId: '',
    sortBy: 'ID',
    direction: 'ASC',
  });

  const handleSearch = (kw) => {
    setFilter('keywords', kw);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await deleteRoom(deleteId, locale);
      setActionSuccess('Đã vô hiệu hóa phòng thành công');
      setDeleteId(null);
      reload();
    } catch (err) {
      setActionError(err.message || 'Không thể xóa phòng');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', className: 'w-16' },
    {
      key: 'imageRoom',
      title: 'Ảnh',
      className: 'w-20',
      render: (row) =>
        row.imageRoom ? (
          <img src={row.imageRoom} alt="" className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 bg-stone-100 rounded flex items-center justify-center text-xs text-slate-400">
            N/A
          </div>
        ),
    },
    { key: 'roomNumber', title: 'Số phòng' },
    {
      key: 'roomType',
      title: 'Loại phòng',
      render: (row) => row.roomType?.typeName || '—',
    },
    { key: 'floorNumber', title: 'Tầng', className: 'w-16' },
    {
      key: 'roomStatus',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.roomStatus} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      className: 'w-24',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/admin/rooms/${row.id}/edit`}
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
        title="Quản lý phòng"
        subtitle="Tìm kiếm, lọc theo trạng thái, tầng và loại phòng"
        actionLabel="Thêm phòng"
        actionTo="/admin/rooms/new"
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
              options: ROOM_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
            },
            {
              key: 'roomTypeId',
              label: 'Loại phòng',
              value: filters.roomTypeId || '',
              onChange: (v) => setFilter('roomTypeId', v),
              options: roomTypes.map((rt) => ({
                value: String(rt.id),
                label: rt.typeName,
              })),
            },
          ]}
          extra={
            <>
              <div className="flex flex-col gap-1 min-w-[100px]">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tầng
                </label>
                <input
                  type="number"
                  min={1}
                  value={filters.floorNumber || ''}
                  onChange={(e) => setFilter('floorNumber', e.target.value)}
                  placeholder="Tất cả"
                  className="border border-stone-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
                />
              </div>
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
        <p className="text-slate-600 mb-6">
          Phòng sẽ chuyển sang trạng thái INACTIVE. Tiếp tục?
        </p>
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

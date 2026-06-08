import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { getAllRequests, deleteRequest } from '../../services/maintenanceService';
import PageHeader from '../../components/common/PageHeader';
import ListToolbar from '../../components/common/ListToolbar';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import { MAINTENANCE_STATUS, MAINTENANCE_SEVERITY } from '../../constants/enums';
import { formatDateTime } from '../../utils/format';

export default function MaintenanceListPage() {
  const { locale } = useLocale();
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllRequests(locale);
      setAllData(res?.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách bảo trì');
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [locale]);

  const filteredData = useMemo(() => {
    let result = [...allData];
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (item) =>
          item.issueTitle?.toLowerCase().includes(kw) ||
          item.issueDescription?.toLowerCase().includes(kw) ||
          String(item.id).includes(kw)
      );
    }
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (severityFilter) {
      result = result.filter((item) => item.severity === severityFilter);
    }
    return result;
  }, [allData, keyword, statusFilter, severityFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await deleteRequest(deleteId, locale);
      setActionSuccess('Đã xóa phiếu bảo trì');
      setDeleteId(null);
      load();
    } catch (err) {
      setActionError(err.message || 'Không thể xóa phiếu');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', className: 'w-16' },
    { key: 'issueTitle', title: 'Tiêu đề' },
    {
      key: 'severity',
      title: 'Mức độ',
      render: (row) => <StatusBadge status={row.severity} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'roomId', title: 'Phòng', render: (row) => row.roomId || '—' },
    { key: 'equipmentId', title: 'Thiết bị', render: (row) => row.equipmentId || '—' },
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
            to={`/admin/maintenance/${row.id}/edit`}
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
        title="Quản lý phiếu bảo trì"
        subtitle="Danh sách toàn bộ phiếu (không phân trang) — lọc phía client"
        actionLabel="Tạo phiếu mới"
        actionTo="/admin/maintenance/new"
      />

      <Alert type="error" message={error || actionError} onClose={() => setActionError('')} />
      <Alert type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <ListToolbar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={setKeyword}
          filters={[
            {
              key: 'status',
              label: 'Trạng thái',
              value: statusFilter,
              onChange: setStatusFilter,
              options: MAINTENANCE_STATUS.map((s) => ({
                value: s,
                label: s.replace(/_/g, ' '),
              })),
            },
            {
              key: 'severity',
              label: 'Mức độ',
              value: severityFilter,
              onChange: setSeverityFilter,
              options: MAINTENANCE_SEVERITY.map((s) => ({
                value: s,
                label: s,
              })),
            },
          ]}
        />

        <div className="px-4 py-2 text-xs text-slate-500 border-b border-stone-100">
          Hiển thị {filteredData.length} / {allData.length} phiếu
        </div>

        <DataTable columns={columns} data={filteredData} loading={loading} />
      </div>

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Bạn có chắc muốn xóa phiếu #{deleteId}?</p>
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

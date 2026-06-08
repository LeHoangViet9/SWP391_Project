import { useState, useEffect, useMemo, useCallback } from 'react';
import { Wrench, DollarSign, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardShell from '../components/layout/DashboardShell';
import StatCard from '../components/dashboard/StatCard';
import MapChart from '../components/dashboard/MapChart';
import SearchBar from '../components/common/SearchBar';
import FilterSelect from '../components/common/FilterSelect';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { getMaintenanceDashboard } from '../services/dashboardService';
import {
  getAllRequests,
  createRequest,
  updateRequest,
  deleteRequest,
} from '../services/maintenanceService';
import { MAINTENANCE_SEVERITY, MAINTENANCE_STATUS } from '../constants/enums';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function MaintenanceDashboard() {
  const { locale } = useLocale();
  const { user } = useAuth();

  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'create', id: null });
  const [createForm, setCreateForm] = useState({
    roomId: '',
    equipmentId: '',
    reportedBy: String(user?.id || ''),
    issueTitle: '',
    issueDescription: '',
    severity: 'MEDIUM',
  });
  const [updateForm, setUpdateForm] = useState({
    assignedTo: '',
    severity: 'MEDIUM',
    status: 'PENDING',
    diagnosis: '',
    repairResult: '',
  });

  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDash = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await getMaintenanceDashboard(locale);
      setDashData(res?.data);
    } catch {
      setDashData(null);
    } finally {
      setDashLoading(false);
    }
  }, [locale]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await getAllRequests(locale);
      setRequests(res?.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách phiếu');
      setRequests([]);
    } finally {
      setListLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadDash();
    loadList();
  }, [loadDash, loadList]);

  const filtered = useMemo(() => {
    let rows = [...requests];
    if (keyword) {
      const kw = keyword.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.issueTitle?.toLowerCase().includes(kw) ||
          r.issueDescription?.toLowerCase().includes(kw) ||
          String(r.roomId || '').includes(kw) ||
          String(r.id).includes(kw)
      );
    }
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    if (severityFilter) rows = rows.filter((r) => r.severity === severityFilter);
    return rows;
  }, [requests, keyword, statusFilter, severityFilter]);

  const openCreate = () => {
    setCreateForm({
      roomId: '',
      equipmentId: '',
      reportedBy: String(user?.id || ''),
      issueTitle: '',
      issueDescription: '',
      severity: 'MEDIUM',
    });
    setModal({ open: true, mode: 'create', id: null });
  };

  const openEdit = (row) => {
    setUpdateForm({
      assignedTo: String(row.assignedTo || ''),
      severity: row.severity || 'MEDIUM',
      status: row.status || 'PENDING',
      diagnosis: row.diagnosis || '',
      repairResult: row.repairResult || '',
    });
    setModal({ open: true, mode: 'edit', id: row.id });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createRequest({
        roomId: createForm.roomId ? Number(createForm.roomId) : null,
        equipmentId: createForm.equipmentId ? Number(createForm.equipmentId) : null,
        reportedBy: Number(createForm.reportedBy),
        issueTitle: createForm.issueTitle,
        issueDescription: createForm.issueDescription || undefined,
        severity: createForm.severity,
      }, locale);
      setSuccess('Đã tạo phiếu bảo trì');
      setModal({ open: false, mode: 'create', id: null });
      loadList();
      loadDash();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateRequest(modal.id, {
        assignedTo: updateForm.assignedTo ? Number(updateForm.assignedTo) : null,
        severity: updateForm.severity,
        status: updateForm.status,
        diagnosis: updateForm.diagnosis || undefined,
        repairResult: updateForm.repairResult || undefined,
      }, locale);
      setSuccess('Đã cập nhật phiếu');
      setModal({ open: false, mode: 'create', id: null });
      loadList();
      loadDash();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteRequest(deleteId, locale);
      setSuccess('Đã xóa phiếu');
      setDeleteId(null);
      loadList();
      loadDash();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'id', title: 'ID', className: 'w-14' },
    { key: 'issueTitle', title: 'Tiêu đề' },
    { key: 'roomId', title: 'Phòng', render: (r) => r.roomId || '—' },
    { key: 'severity', title: 'Mức độ', render: (r) => <StatusBadge status={r.severity} /> },
    { key: 'status', title: 'Trạng thái', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', title: 'Ngày tạo', render: (r) => formatDateTime(r.createdAt) },
    {
      key: 'actions',
      title: '',
      className: 'w-20',
      render: (r) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openEdit(r)} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil size={15} /></button>
          <button type="button" onClick={() => setDeleteId(r.id)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <DashboardShell title="Bảng điều khiển Bảo trì">
      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      {dashLoading ? (
        <div className="text-center py-8 text-slate-400">Đang tải thống kê...</div>
      ) : dashData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Tổng phiếu" value={dashData.totalRequests ?? 0} icon={Wrench} />
          <StatCard title="Đang chờ" value={dashData.pendingRequests ?? 0} icon={AlertTriangle} accent="red" />
          <StatCard title="Đang xử lý" value={dashData.inProgressRequests ?? 0} icon={Wrench} accent="purple" />
          <StatCard title="Tổng chi phí" value={formatCurrency(dashData.totalCost)} icon={DollarSign} accent="green" />
        </div>
      )}

      {dashData?.requestsBySeverity && (
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">Theo mức độ nghiêm trọng</h2>
          <MapChart data={dashData.requestsBySeverity} />
        </div>
      )}

      <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-stone-200">
          <h2 className="font-display text-lg font-semibold">Danh sách phiếu sự cố</h2>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 btn-gold px-4 py-2 rounded-lg text-sm">
            <Plus size={16} /> Thêm phiếu
          </button>
        </div>
        <div className="flex flex-wrap gap-3 p-4 border-b border-stone-100">
          <SearchBar value={keyword} onChange={setKeyword} onSubmit={setKeyword} placeholder="Tìm theo phòng, tiêu đề, mô tả..." />
          <FilterSelect label="Trạng thái" value={statusFilter} onChange={setStatusFilter} options={MAINTENANCE_STATUS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
          <FilterSelect label="Mức độ" value={severityFilter} onChange={setSeverityFilter} options={MAINTENANCE_SEVERITY.map((s) => ({ value: s, label: s }))} />
        </div>
        <p className="px-4 py-2 text-xs text-slate-500 border-b border-stone-50">
          Hiển thị {filtered.length} / {requests.length} phiếu
        </p>
        <DataTable columns={columns} data={filtered} loading={listLoading} />
      </section>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', id: null })} title={modal.mode === 'create' ? 'Thêm phiếu bảo trì' : `Sửa phiếu #${modal.id}`} size="lg">
        {modal.mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tiêu đề *</label>
              <input required value={createForm.issueTitle} onChange={(e) => setCreateForm({ ...createForm, issueTitle: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Mô tả</label>
              <textarea rows={3} value={createForm.issueDescription} onChange={(e) => setCreateForm({ ...createForm, issueDescription: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">ID Phòng</label>
                <input type="number" value={createForm.roomId} onChange={(e) => setCreateForm({ ...createForm, roomId: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">ID Thiết bị</label>
                <input type="number" value={createForm.equipmentId} onChange={(e) => setCreateForm({ ...createForm, equipmentId: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Mức độ *</label>
                <select required value={createForm.severity} onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                  {MAINTENANCE_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Người báo cáo (ID) *</label>
              <input type="number" required value={createForm.reportedBy} onChange={(e) => setCreateForm({ ...createForm, reportedBy: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm max-w-[160px]" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
              <button type="submit" disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-60">{saving ? '...' : 'Tạo phiếu'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Mức độ</label>
                <select value={updateForm.severity} onChange={(e) => setUpdateForm({ ...updateForm, severity: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                  {MAINTENANCE_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Trạng thái</label>
                <select value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white">
                  {MAINTENANCE_STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Người được giao (ID)</label>
              <input type="number" value={updateForm.assignedTo} onChange={(e) => setUpdateForm({ ...updateForm, assignedTo: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm max-w-[160px]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Chẩn đoán</label>
              <textarea rows={2} value={updateForm.diagnosis} onChange={(e) => setUpdateForm({ ...updateForm, diagnosis: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Kết quả sửa chữa</label>
              <textarea rows={2} value={updateForm.repairResult} onChange={(e) => setUpdateForm({ ...updateForm, repairResult: e.target.value })} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal({ open: false, mode: 'create', id: null })} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
              <button type="submit" disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-60">{saving ? '...' : 'Cập nhật'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Xác nhận xóa">
        <p className="text-slate-600 mb-6">Xóa phiếu #{deleteId}?</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
          <button type="button" onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60">Xóa</button>
        </div>
      </Modal>
    </DashboardShell>
  );
}

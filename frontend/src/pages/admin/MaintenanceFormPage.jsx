import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useAuth } from '../../context/AuthContext';
import {
  createRequest,
  updateRequest,
  getRequestById,
} from '../../services/maintenanceService';
import Alert from '../../components/common/Alert';
import { MAINTENANCE_SEVERITY, MAINTENANCE_STATUS } from '../../constants/enums';

const emptyCreateForm = {
  roomId: '',
  equipmentId: '',
  reportedBy: '',
  issueTitle: '',
  issueDescription: '',
  severity: 'MEDIUM',
};

const emptyUpdateForm = {
  assignedTo: '',
  severity: 'MEDIUM',
  status: 'PENDING',
  diagnosis: '',
  repairResult: '',
};

export default function MaintenanceFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== 'new';
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { user } = useAuth();

  const [createForm, setCreateForm] = useState({
    ...emptyCreateForm,
    reportedBy: String(user?.id || ''),
  });
  const [updateForm, setUpdateForm] = useState(emptyUpdateForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await getRequestById(id, locale);
        if (cancelled) return;
        const m = res?.data;
        setUpdateForm({
          assignedTo: String(m.assignedTo || ''),
          severity: m.severity || 'MEDIUM',
          status: m.status || 'PENDING',
          diagnosis: m.diagnosis || '',
          repairResult: m.repairResult || '',
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không thể tải phiếu bảo trì');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isEdit, locale]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      roomId: createForm.roomId ? Number(createForm.roomId) : null,
      equipmentId: createForm.equipmentId ? Number(createForm.equipmentId) : null,
      reportedBy: Number(createForm.reportedBy),
      issueTitle: createForm.issueTitle,
      issueDescription: createForm.issueDescription || undefined,
      severity: createForm.severity,
    };
    try {
      await createRequest(payload, locale);
      navigate('/admin/maintenance');
    } catch (err) {
      setError(err.message || 'Không thể tạo phiếu');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      assignedTo: updateForm.assignedTo ? Number(updateForm.assignedTo) : null,
      severity: updateForm.severity,
      status: updateForm.status,
      diagnosis: updateForm.diagnosis || undefined,
      repairResult: updateForm.repairResult || undefined,
    };
    try {
      await updateRequest(id, payload, locale);
      navigate('/admin/maintenance');
    } catch (err) {
      setError(err.message || 'Không thể cập nhật phiếu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/admin/maintenance"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#bfa15f] mb-4"
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">
        {isEdit ? `Cập nhật phiếu #${id}` : 'Tạo phiếu bảo trì mới'}
      </h1>

      <Alert type="error" message={error} />

      {isEdit ? (
        <form onSubmit={handleUpdateSubmit} className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Mức độ
              </label>
              <select
                value={updateForm.severity}
                onChange={(e) => setUpdateForm({ ...updateForm, severity: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-[#bfa15f]"
              >
                {MAINTENANCE_SEVERITY.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Trạng thái
              </label>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-[#bfa15f]"
              >
                {MAINTENANCE_STATUS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Người được giao (ID)
            </label>
            <input
              type="number"
              value={updateForm.assignedTo}
              onChange={(e) => setUpdateForm({ ...updateForm, assignedTo: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Chẩn đoán
            </label>
            <textarea
              rows={3}
              value={updateForm.diagnosis}
              onChange={(e) => setUpdateForm({ ...updateForm, diagnosis: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Kết quả sửa chữa
            </label>
            <textarea
              rows={3}
              value={updateForm.repairResult}
              onChange={(e) => setUpdateForm({ ...updateForm, repairResult: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 btn-gold px-6 py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCreateSubmit} className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Tiêu đề sự cố *
            </label>
            <input
              type="text"
              required
              value={createForm.issueTitle}
              onChange={(e) => setCreateForm({ ...createForm, issueTitle: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={createForm.issueDescription}
              onChange={(e) => setCreateForm({ ...createForm, issueDescription: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                ID Phòng
              </label>
              <input
                type="number"
                value={createForm.roomId}
                onChange={(e) => setCreateForm({ ...createForm, roomId: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                ID Thiết bị
              </label>
              <input
                type="number"
                value={createForm.equipmentId}
                onChange={(e) => setCreateForm({ ...createForm, equipmentId: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Mức độ *
              </label>
              <select
                required
                value={createForm.severity}
                onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })}
                className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-[#bfa15f]"
              >
                {MAINTENANCE_SEVERITY.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Người báo cáo (ID) *
            </label>
            <input
              type="number"
              required
              value={createForm.reportedBy}
              onChange={(e) => setCreateForm({ ...createForm, reportedBy: e.target.value })}
              className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#bfa15f] max-w-[200px]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 btn-gold px-6 py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Đang lưu...' : 'Tạo phiếu'}
          </button>
        </form>
      )}
    </div>
  );
}

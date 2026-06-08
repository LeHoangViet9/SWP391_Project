import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { maintenanceService } from '../services/maintenanceService';
import { useLocale } from '../context/LocaleContext';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const SEVERITY_COLORS = {
  LOW: 'bg-stone-100 text-stone-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const EMPTY_CREATE = {
  roomId: '',
  equipmentId: '',
  reportedBy: '',
  issueTitle: '',
  issueDescription: '',
  severity: 'MEDIUM',
};

const EMPTY_UPDATE = {
  assignedTo: '',
  severity: 'MEDIUM',
  status: 'PENDING',
  diagnosis: '',
  repairResult: '',
};

export default function MaintenanceManager({ readOnly = false }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await maintenanceService.getAll();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setItems(list);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm({
      ...EMPTY_CREATE,
      reportedBy: user?.id ? String(user.id) : '',
    });
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    setForm({
      assignedTo: item.assignedTo || '',
      severity: item.severity || 'MEDIUM',
      status: item.status || 'PENDING',
      diagnosis: item.diagnosis || '',
      repairResult: item.repairResult || '',
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (modal.editing) {
        const payload = {
          assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
          severity: form.severity,
          status: form.status,
          diagnosis: form.diagnosis || undefined,
          repairResult: form.repairResult || undefined,
        };
        await maintenanceService.update(modal.editing.id, payload);
        notify(t('maintenance.toast.updateSuccess'));
      } else {
        const payload = {
          roomId: form.roomId ? Number(form.roomId) : undefined,
          equipmentId: form.equipmentId ? Number(form.equipmentId) : undefined,
          reportedBy: Number(form.reportedBy),
          issueTitle: form.issueTitle.trim(),
          issueDescription: form.issueDescription.trim(),
          severity: form.severity,
        };
        await maintenanceService.create(payload);
        notify(t('maintenance.toast.addSuccess'));
      }
      closeModal();
      fetchData();
    } catch (e) {
      notify(e.status === 403 ? t('maintenance.toast.forbidden') : (e.message || t('maintenance.toast.loadError')), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t('maintenance.toast.deleteConfirm', { id: item.id }).replace('{id}', item.id))) return;
    try {
      await maintenanceService.delete(item.id);
      notify(t('maintenance.toast.deleteSuccess'));
      fetchData();
    } catch (e) {
      notify(e.status === 403 ? t('maintenance.toast.forbiddenDelete') : e.message, 'error');
    }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN') : '-';

  const rows = items.map(item => (
    <tr key={item.id} className="hover:bg-stone-50">
      <td className="px-4 py-3 font-mono text-xs font-bold">#{item.id}</td>
      <td className="px-4 py-3 font-semibold text-sm">{item.issueTitle}</td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{item.issueDescription || '-'}</td>
      <td className="px-4 py-3 text-xs">{item.roomId ? `Phòng #${item.roomId}` : '-'}</td>
      <td className="px-4 py-3 text-xs">{item.equipmentId ? `TB #${item.equipmentId}` : '-'}</td>
      <td className="px-4 py-3 text-xs">{item.reportedBy || '-'}</td>
      <td className="px-4 py-3 text-xs">{item.assignedTo || '-'}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.MEDIUM}`}>
          {t(`maintenance.severity.${item.severity || 'MEDIUM'}`)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || STATUS_COLORS.PENDING}`}>
          {t(`maintenance.status.${item.status || 'PENDING'}`)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(item.createdAt)}</td>
      {!readOnly && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit2 size={15} /></button>
            <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
          </div>
        </td>
      )}
    </tr>
  ));

  const cols = [t('maintenance.columns.id'), t('maintenance.columns.title'), t('maintenance.columns.description'), t('maintenance.columns.room'), t('maintenance.columns.equipment'), t('maintenance.columns.reportedBy'), t('maintenance.columns.assignedTo'), t('maintenance.columns.severity'), t('maintenance.columns.status'), t('maintenance.columns.createdAt'), ...(!readOnly ? [t('maintenance.columns.actions')] : [])];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex justify-between gap-3 mb-4">
        <button onClick={fetchData} className="p-2 border rounded hover:bg-stone-100"><RefreshCw size={14} /></button>
        {!readOnly && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow">
            <Plus size={16} /> {t('maintenance.addBtn')}
          </button>
        )}
      </div>

      <DataTable columns={cols} rows={rows} loading={loading} emptyText={t('maintenance.emptyText')} />

      <Modal open={modal.open} title={modal.editing ? t('maintenance.modal.editTitle') : t('maintenance.modal.addTitle')} onClose={closeModal} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {modal.editing ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.assignedTo')}</label>
                  <input type="number" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.severity')}</label>
                  <select required value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                    {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.status')}</label>
                  <select required value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.diagnosis')}</label>
                <textarea rows={2} value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.repairResult')}</label>
                <textarea rows={2} value={form.repairResult} onChange={e => setForm(f => ({ ...f, repairResult: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.title')}</label>
                <input required value={form.issueTitle} onChange={e => setForm(f => ({ ...f, issueTitle: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" placeholder={t('maintenance.modal.titlePlaceholder')} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.room')}</label>
                  <input type="number" value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.equipment')}</label>
                  <input type="number" value={form.equipmentId} onChange={e => setForm(f => ({ ...f, equipmentId: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.reportedBy')}</label>
                  <input required type="number" value={form.reportedBy} onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.severity')}</label>
                <select required value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                  {SEVERITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t('maintenance.modal.description')}</label>
                <textarea rows={3} value={form.issueDescription} onChange={e => setForm(f => ({ ...f, issueDescription: e.target.value }))}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none resize-none" />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t('maintenance.modal.cancel')}</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? t('maintenance.modal.saving') : modal.editing ? t('maintenance.modal.update') : t('maintenance.modal.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

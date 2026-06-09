import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, RefreshCw } from 'lucide-react';
import DataTable from './shared/DataTable';
import Modal from './shared/Modal';
import Toast from './shared/Toast';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';

const ROLES = ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPER', 'MAINTENANCE', 'CUSTOMER'];

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
  { value: 'BANNED', label: 'Bị cấm' },
];

const EMPTY_FORM = {
  fullName: '',
  userName: '',
  password: '',
  rePassword: '',
  email: '',
  phone: '',
  roleName: 'RECEPTIONIST',
  accountStatus: 'ACTIVE',
};

export default function StaffManager() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await getUsers({
        page: p,
        size: 10,
        keywords: search || undefined,
        status: statusFilter || undefined,
      });
      setStaffs(res?.data?.content ?? []);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchData(page);
  }, [page, statusFilter, fetchData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, editing: null });
  };

  const openEdit = (item) => {
    setForm({
      fullName: item.fullName || '',
      userName: item.userName || item.username || '',
      password: '',
      rePassword: '',
      email: item.email || '',
      phone: item.phone || '',
      roleName: item.roleName || 'RECEPTIONIST',
      accountStatus: item.accountStatus || item.status || 'ACTIVE',
    });
    setModal({ open: true, editing: item });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const buildPayload = () => {
    const payload = {
      fullName: form.fullName.trim(),
      userName: form.userName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      roleName: form.roleName,
      accountStatus: form.accountStatus,
    };
    if (form.password) {
      payload.password = form.password;
      payload.rePassword = form.rePassword;
    }
    return payload;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modal.editing && !form.password) {
      return notify('Vui lòng nhập mật khẩu cho tài khoản mới!', 'warning');
    }
    if ((form.password || form.rePassword) && form.password !== form.rePassword) {
      return notify('Mật khẩu xác nhận không khớp!', 'warning');
    }

    setSaving(true);
    try {
      if (modal.editing) {
        await updateUser(modal.editing.id, buildPayload());
        notify('Cập nhật tài khoản thành công!');
      } else {
        await createUser(buildPayload());
        notify('Đăng ký tài khoản nhân viên mới thành công!');
      }
      closeModal();
      fetchData(page);
    } catch (err) {
      notify(err.message || 'Không thể lưu tài khoản nhân viên.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa tài khoản "${item.fullName}"?`)) return;
    try {
      await deleteUser(item.id);
      notify('Đã xóa tài khoản nhân viên!');
      fetchData(page);
    } catch (err) {
      notify(err.message || 'Không thể xóa tài khoản.', 'error');
    }
  };

  const rows = staffs.map(item => (
    <tr key={item.id} className="hover:bg-stone-50">
      <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
      <td className="px-4 py-3 font-semibold">{item.fullName}</td>
      <td className="px-4 py-3 font-mono text-xs text-[#bfa15f]">{item.userName || item.username}</td>
      <td className="px-4 py-3 text-xs">{item.email}</td>
      <td className="px-4 py-3 text-xs">{item.phone}</td>
      <td className="px-4 py-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
          {item.roleName}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          (item.accountStatus || item.status) === 'ACTIVE'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-stone-100 text-stone-600'
        }`}>
          {item.accountStatus || item.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700" title="Chỉnh sửa">
            <Edit2 size={15} />
          </button>
          <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700" title="Xóa">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  ));

  const cols = ['ID', 'Họ Tên', 'Tên Đăng Nhập', 'Email', 'Điện Thoại', 'Vai Trò', 'Trạng Thái', 'Thao tác'];

  return (
    <div>
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData(0)}
              placeholder="Tìm kiếm nhân viên..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded focus:border-[#bfa15f] outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white"
          >
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button onClick={() => fetchData(0)} className="p-2 border rounded hover:bg-stone-100">
            <RefreshCw size={14} />
          </button>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white px-4 py-2 rounded text-sm font-semibold shadow">
          <Plus size={16} /> Đăng ký nhân viên
        </button>
      </div>

      <DataTable columns={cols} rows={rows} loading={loading} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={modal.open} title={modal.editing ? 'Cập Nhật Tài Khoản Nhân Viên' : 'Đăng Ký Tài Khoản Nhân Viên Mới'} onClose={closeModal} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Họ và Tên *</label>
              <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Tên Đăng Nhập *</label>
              <input required value={form.userName} onChange={e => setForm(f => ({ ...f, userName: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                {modal.editing ? 'Mật Khẩu Mới' : 'Mật Khẩu *'}
              </label>
              <input required={!modal.editing} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">
                {modal.editing ? 'Xác Nhận Mật Khẩu Mới' : 'Xác Nhận Mật Khẩu *'}
              </label>
              <input required={!modal.editing} type="password" value={form.rePassword} onChange={e => setForm(f => ({ ...f, rePassword: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Số Điện Thoại *</label>
              <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Vai Trò Phân Quyền *</label>
              <select required value={form.roleName} onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Trạng Thái *</label>
              <select required value={form.accountStatus} onChange={e => setForm(f => ({ ...f, accountStatus: e.target.value }))}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:border-[#bfa15f] outline-none bg-white">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="BANNED">BANNED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">Hủy</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded font-semibold shadow disabled:opacity-60">
              {saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Đăng ký tài khoản'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

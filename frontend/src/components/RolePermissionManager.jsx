import React, { useState, useEffect } from 'react';
import { Shield, Save, RefreshCw, Check, X } from 'lucide-react';
import { getRoles, getPermissions, assignPermissionsToRole } from '../services/roleService';
import { useLocale } from '../context/LocaleContext';
import Toast from './shared/Toast';

const PERMISSION_GROUPS = {
  USER: { vi: 'Quản lý Tài khoản', en: 'User Management' },
  ROOM: { vi: 'Quản lý Phòng', en: 'Room Management' },
  ROOM_TYPE: { vi: 'Quản lý Loại Phòng', en: 'Room Type Management' },
  CUSTOMER: { vi: 'Quản lý Khách hàng', en: 'Customer Management' },
  BOOKING: { vi: 'Quản lý Đặt phòng', en: 'Booking Management' },
  HOUSEKEEPING: { vi: 'Dọn phòng', en: 'Housekeeping' },
  EQUIPMENT: { vi: 'Trang thiết bị', en: 'Equipment' },
  MAINTENANCE: { vi: 'Bảo trì & Sửa chữa', en: 'Maintenance' },
  FEEDBACK: { vi: 'Phản hồi', en: 'Feedback' },
  INVOICE: { vi: 'Hóa đơn & Thanh toán', en: 'Invoice & Payment' },
  DASHBOARD: { vi: 'Báo cáo & Dashboard', en: 'Reports & Dashboard' }
};

export default function RolePermissionManager() {
  const { locale } = useLocale();
  const isVi = locale === 'vi';

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: 'success', message: '' });

  const notify = (message, type = 'success') => setToast({ type, message });
  const closeToast = () => setToast(t => ({ ...t, message: '' }));

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        getRoles(locale),
        getPermissions(locale)
      ]);
      setRoles(rolesRes?.data ?? []);
      setPermissions(permsRes?.data ?? []);
      
      // Auto select first role
      if (rolesRes?.data?.length > 0) {
        handleSelectRole(rolesRes.data[0]);
      }
    } catch (e) {
      notify(e.message || (isVi ? 'Lỗi tải phân quyền' : 'Failed to load permissions'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [locale]);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    const permIds = role?.permissions?.map(p => p.id) || [];
    setRolePermissions(new Set(permIds));
  };

  const handleTogglePermission = (permId) => {
    const next = new Set(rolePermissions);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setRolePermissions(next);
  };

  const handleToggleGroup = (groupPrefix, checkAll) => {
    const next = new Set(rolePermissions);
    const groupPerms = permissions.filter(p => p.name.startsWith(groupPrefix));
    
    groupPerms.forEach(p => {
      if (checkAll) {
        next.add(p.id);
      } else {
        next.delete(p.id);
      }
    });
    setRolePermissions(next);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const permissionIds = Array.from(rolePermissions);
      const res = await assignPermissionsToRole(selectedRole.id, permissionIds, locale);
      
      // Update local roles state
      setRoles(roles.map(r => r.id === selectedRole.id ? { ...r, permissions: res.data.permissions } : r));
      notify(isVi ? 'Lưu cấu hình phân quyền thành công!' : 'Saved permissions successfully!');
    } catch (e) {
      notify(e.message || (isVi ? 'Lỗi khi lưu phân quyền' : 'Failed to save permissions'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by prefix
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const parts = perm.name.split('_');
    // Group key is the prefix, e.g. "ROOM" from "ROOM_VIEW" or "BOOKING" from "BOOKING_VIEW_OWN"
    // Handle special cases or default prefix
    let groupKey = parts[0];
    if (perm.name.startsWith('ROOM_TYPE')) groupKey = 'ROOM_TYPE';
    if (!PERMISSION_GROUPS[groupKey]) groupKey = 'OTHER';

    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(perm);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#bfa15f]">
        <div className="w-8 h-8 border-2 border-[#bfa15f] border-t-transparent rounded-full animate-spin mr-3" />
        <span>{isVi ? 'Đang tải thông tin phân quyền...' : 'Loading permissions...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast type={toast.type} message={toast.message} onClose={closeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-[#bfa15f]" size={22} />
            {isVi ? 'Cấu hình Phân quyền Hệ thống' : 'System Role Permissions'}
          </h2>
          <p className="text-xs text-white/50 mt-1">
            {isVi ? 'Chọn một vai trò để tùy chỉnh danh sách các quyền truy cập.' : 'Select a role to customize its access rights.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-all"
            title={isVi ? 'Làm mới' : 'Refresh'}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedRole}
            className="flex items-center gap-2 btn-gold px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? (isVi ? 'Đang lưu...' : 'Saving...') : (isVi ? 'Lưu cấu hình' : 'Save Changes')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1 bg-[#112240] border border-white/[0.08] rounded-2xl p-4 space-y-2 h-fit">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider px-2 mb-3">
            {isVi ? 'Vai trò / Nhóm người dùng' : 'Roles / Groups'}
          </h3>
          {roles.map((role) => {
            const isSelected = selectedRole?.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#bfa15f] text-white font-bold shadow-lg shadow-[#bfa15f]/25'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{role.roleName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                  }`}>
                    {role.permissions?.length || 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-3 space-y-4">
          {selectedRole ? (
            Object.entries(PERMISSION_GROUPS).map(([groupKey, groupLabel]) => {
              const groupPerms = groupedPermissions[groupKey] || [];
              if (groupPerms.length === 0) return null;

              const label = isVi ? groupLabel.vi : groupLabel.en;
              const allChecked = groupPerms.every(p => rolePermissions.has(p.id));
              const someChecked = groupPerms.some(p => rolePermissions.has(p.id));

              return (
                <div key={groupKey} className="bg-[#112240] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                  {/* Group Header */}
                  <div className="bg-[#0f1d3a] px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{label}</h4>
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(groupKey, !allChecked)}
                      className="text-xs font-semibold text-[#bfa15f] hover:text-[#d4b97f] transition-colors"
                    >
                      {allChecked ? (isVi ? 'Bỏ chọn tất cả' : 'Deselect All') : (isVi ? 'Chọn tất cả' : 'Select All')}
                    </button>
                  </div>

                  {/* Group Items */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groupPerms.map((perm) => {
                      const isChecked = rolePermissions.has(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                            isChecked
                              ? 'bg-[#bfa15f]/10 border-[#bfa15f]/40 text-white'
                              : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5 hover:border-white/10 hover:text-white/80'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-mono font-bold tracking-wider truncate">{perm.name}</span>
                            <span className="text-[10px] text-white/40 mt-0.5">
                              {perm.description || (isVi ? 'Không có mô tả' : 'No description available')}
                            </span>
                          </div>
                          
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-[#bfa15f] border-[#bfa15f] text-white shadow-sm'
                              : 'border-white/20'
                          }`}>
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#112240] border border-white/[0.08] rounded-2xl p-12 text-center">
              <Shield className="mx-auto text-white/20 mb-3" size={40} />
              <p className="text-sm text-white/40">
                {isVi ? 'Hãy chọn một vai trò bên trái để hiển thị danh sách quyền.' : 'Select a role on the left to see permissions.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import os

def patch_booking_manager():
    path = r"e:\HMS\SWP391_Project\frontend\src\components\BookingManager.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import useLocale
    if "import { useLocale }" not in content:
        content = content.replace(
            "import DataTable from './shared/DataTable';",
            "import { useLocale } from '../context/LocaleContext';\nimport DataTable from './shared/DataTable';"
        )

    # Inject t
    content = content.replace(
        "export default function BookingManager({ readOnly = false }) {",
        "export default function BookingManager({ readOnly = false }) {\n  const { t } = useLocale();"
    )

    # Toast and permission changes
    content = content.replace(
        "if (!isReceptionistOrAbove) return notify('Bạn không có quyền tạo đặt phòng!', 'error');",
        "if (!isReceptionistOrAbove) return notify(t('booking.toast.forbiddenCreate'), 'error');"
    )
    content = content.replace(
        "if (!isReceptionistOrAbove) return notify('Bạn không có quyền sửa đơn đặt phòng!', 'error');",
        "if (!isReceptionistOrAbove) return notify(t('booking.toast.forbiddenEdit'), 'error');"
    )
    content = content.replace(
        "notify('Cập nhật đặt phòng thành công!');",
        "notify(t('booking.toast.updateSuccess'));"
    )
    content = content.replace(
        "notify('Tạo đặt phòng thành công!');",
        "notify(t('booking.toast.addSuccess'));"
    )
    content = content.replace(
        "notify(e.status === 403 ? '403 Forbidden - Bạn không có quyền!' : (e.message || 'Lỗi không xác định'), 'error');",
        "notify(e.status === 403 ? t('booking.toast.forbidden') : (e.message || t('booking.toast.loadError')), 'error');"
    )
    content = content.replace(
        "if (!isReceptionistOrAbove) return notify('Bạn không có quyền xóa đặt phòng!', 'error');",
        "if (!isReceptionistOrAbove) return notify(t('booking.toast.forbiddenDelete'), 'error');"
    )
    content = content.replace(
        "if (!window.confirm(`Xóa đặt phòng ID ${item.id}?`)) return;",
        "if (!window.confirm(t('booking.toast.deleteConfirm', { id: item.id }).replace('{id}', item.id))) return;"
    )
    content = content.replace(
        "notify('Đã xóa đơn đặt phòng!');",
        "notify(t('booking.toast.deleteSuccess'));"
    )
    content = content.replace(
        "notify(e.status === 403 ? '403 Forbidden - Không có quyền xóa!' : e.message, 'error');",
        "notify(e.status === 403 ? t('booking.toast.forbiddenDelete') : e.message, 'error');"
    )

    # renderStatusBadge
    content = content.replace(
        "return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${opt.color}`}>{opt.label}</span>;",
        "return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${opt.color}`}>{t(`booking.status.${opt.value}`)}</span>;"
    )

    # customerName fallback
    content = content.replace(
        "Khách #${item.customerId}",
        "t('booking.filters.customer') + ' #' + item.customerId"
    )
    content = content.replace(
        "Loại phòng",
        "t('booking.filters.roomType')"
    )

    # Columns
    content = content.replace(
        "const cols = ['Mã Đơn', 'Khách Hàng', 'Loại Phòng', 'SL Phòng', 'Ngày Nhận', 'Ngày Trả', 'Trạng Thái', 'Tổng Tiền', ...(!readOnly && isReceptionistOrAbove ? ['Thao tác'] : [])];",
        "const cols = [t('booking.columns.id'), t('booking.columns.customer'), t('booking.columns.roomType'), t('booking.columns.quantity'), t('booking.columns.checkIn'), t('booking.columns.checkOut'), t('booking.columns.status'), t('booking.columns.totalPrice'), ...(!readOnly && isReceptionistOrAbove ? [t('booking.columns.actions')] : [])];"
    )

    # Tabs
    content = content.replace(
        "<Calendar size={16} /> Hôm Nay",
        "<Calendar size={16} /> {t('booking.tabs.today')}"
    )
    content = content.replace(
        "<Filter size={16} /> Bộ Lọc Nâng Cao",
        "<Filter size={16} /> {t('booking.tabs.filter')}"
    )
    content = content.replace(
        "Tất Cả Đặt Phòng",
        "{t('booking.tabs.all')}"
    )

    # Overview Headers
    content = content.replace(
        "Nhận Phòng Hôm Nay ({todayCheckIns.length})",
        "{t('booking.overview.checkInToday', { count: todayCheckIns.length }).replace('{count}', todayCheckIns.length)}"
    )
    content = content.replace(
        "Không có lượt nhận phòng hôm nay.",
        "{t('booking.overview.noCheckIn')}"
    )
    content = content.replace(
        "Khách #${item.customerId}",
        "t('booking.filters.customer') + ' #' + item.customerId"
    )
    content = content.replace(
        "Trả Phòng Hôm Nay ({todayCheckOuts.length})",
        "{t('booking.overview.checkOutToday', { count: todayCheckOuts.length }).replace('{count}', todayCheckOuts.length)}"
    )
    content = content.replace(
        "Không có lượt trả phòng hôm nay.",
        "{t('booking.overview.noCheckOut')}"
    )

    # Filter Labels & options
    content = content.replace(
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Trạng Thái</label>',
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t(\'booking.filters.status\')}</label>'
    )
    content = content.replace(
        '<option value="">-- Tất cả --</option>\n                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}',
        '<option value="">{t(\'booking.filters.all\')}</option>\n                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(`booking.status.${opt.value}`)}</option>)}'
    )
    content = content.replace(
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Khách Hàng</label>',
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t(\'booking.filters.customer\')}</label>'
    )
    content = content.replace(
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Loại Phòng</label>',
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t(\'booking.filters.roomType\')}</label>'
    )
    content = content.replace(
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Số Phòng</label>',
        '<label className="block text-xs font-bold text-slate-600 mb-1 uppercase">{t(\'booking.filters.roomNumber\')}</label>'
    )
    content = content.replace(
        '<option value="">-- Tất cả --</option>',
        '<option value="">{t(\'booking.filters.all\')}</option>'
    )
    content = content.replace(
        '<button onClick={() => { setFilterStatus(\'\'); setFilterCustomerId(\'\'); setFilterRoomTypeId(\'\'); setFilterRoomId(\'\'); }} className="px-4 py-2 border rounded text-sm hover:bg-stone-100">Xóa Bộ Lọc</button>',
        '<button onClick={() => { setFilterStatus(\'\'); setFilterCustomerId(\'\'); setFilterRoomTypeId(\'\'); setFilterRoomId(\'\'); }} className="px-4 py-2 border rounded text-sm hover:bg-stone-100">{t(\'booking.filters.clear\')}</button>'
    )
    content = content.replace(
        '<button onClick={() => fetchData(0)} className="px-5 py-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded text-sm font-semibold shadow">Tìm Kiếm</button>',
        '<button onClick={() => fetchData(0)} className="px-5 py-2 bg-[#bfa15f] hover:bg-[#a3854a] text-white rounded text-sm font-semibold shadow">{t(\'booking.filters.search\')}</button>'
    )
    content = content.replace(
        'Tạo đơn đặt phòng',
        "{t('booking.modal.save')}"
    )

    # Modal elements
    content = content.replace(
        'title={modal.editing ? \'Cập Nhật Đơn Đặt Phòng\' : \'Tạo Đơn Đặt Phòng Mới\'}',
        'title={modal.editing ? t(\'booking.modal.editTitle\') : t(\'booking.modal.addTitle\')}'
    )
    content = content.replace(
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Khách Hàng *</label>',
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t(\'booking.modal.customer\')}</label>'
    )
    content = content.replace(
        '<option value="">-- Chọn khách hàng --</option>',
        '<option value="">{t(\'booking.modal.selectCustomer\')}</option>'
    )
    content = content.replace(
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Loại Phòng *</label>',
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t(\'booking.modal.roomType\')}</label>'
    )
    content = content.replace(
        '<option value="">-- Chọn loại phòng --</option>',
        '<option value="">{t(\'booking.modal.selectRoomType\')}</option>'
    )
    content = content.replace(
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Ngày Nhận Phòng *</label>',
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t(\'booking.modal.checkIn\')}</label>'
    )
    content = content.replace(
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Ngày Trả Phòng *</label>',
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t(\'booking.modal.checkOut\')}</label>'
    )
    content = content.replace(
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">Số Phòng Đặt *</label>',
        '<label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wider">{t(\'booking.modal.quantity\')}</label>'
    )
    content = content.replace(
        '<button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">Hủy</button>',
        '<button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t(\'booking.modal.cancel\')}</button>'
    )
    content = content.replace(
        "{saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Tạo mới'}",
        "{saving ? t('booking.modal.saving') : modal.editing ? t('booking.modal.update') : t('booking.modal.save')}"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def patch_equipment_manager():
    path = r"e:\HMS\SWP391_Project\frontend\src\components\EquipmentManager.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import useLocale
    if "import { useLocale }" not in content:
        content = content.replace(
            "import DataTable from './shared/DataTable';",
            "import { useLocale } from '../context/LocaleContext';\nimport DataTable from './shared/DataTable';"
        )

    # Inject t
    content = content.replace(
        "export default function EquipmentManager() {",
        "export default function EquipmentManager() {\n  const { t } = useLocale();"
    )

    # Toast errors & messages
    content = content.replace(
        "notify('Bạn không có quyền thêm thiết bị.', 'error');",
        "notify(t('equipment.toast.forbiddenCreate'), 'error');"
    )
    content = content.replace(
        "notify('Bạn không có quyền sửa thiết bị.', 'error');",
        "notify(t('equipment.toast.forbiddenEdit'), 'error');"
    )
    content = content.replace(
        "notify('Cập nhật thiết bị thành công.');",
        "notify(t('equipment.toast.updateSuccess'));"
    )
    content = content.replace(
        "notify('Thêm thiết bị thành công.');",
        "notify(t('equipment.toast.addSuccess'));"
    )
    content = content.replace(
        "notify('Bạn không có quyền xóa thiết bị.', 'error');",
        "notify(t('equipment.toast.forbiddenDelete'), 'error');"
    )
    content = content.replace(
        "if (!window.confirm(`Xóa thiết bị \"${item.equipmentName}\"?`)) return;",
        "if (!window.confirm(t('equipment.toast.deleteConfirm', { name: item.equipmentName }).replace('{name}', item.equipmentName))) return;"
    )
    content = content.replace(
        "notify('Đã xóa thiết bị.');",
        "notify(t('equipment.toast.deleteSuccess'));"
    )
    content = content.replace(
        "notify(getErrorMessage(error, 'Không tải được danh sách thiết bị.'), 'error');",
        "notify(getErrorMessage(error, t('equipment.toast.loadError')), 'error');"
    )
    content = content.replace(
        "notify(getErrorMessage(error, 'Không lưu được thiết bị.'), 'error');",
        "notify(getErrorMessage(error, t('equipment.toast.loadError')), 'error');"
    )
    content = content.replace(
        "notify(getErrorMessage(error, 'Không xóa được thiết bị.'), 'error');",
        "notify(getErrorMessage(error, t('equipment.toast.loadError')), 'error');"
    )

    # status badge
    content = content.replace(
        "{statusInfo.label}",
        "{t(`equipment.status.${status}`)}"
    )

    # Unassigned room
    content = content.replace(
        "Chưa gán",
        "t('equipment.noRoom')"
    )

    # Table columns
    content = content.replace(
        "const columns = ['ID', 'Tên thiết bị', 'Mã thiết bị', 'Vị trí', 'Mô tả', 'Phòng', 'Trạng thái', 'Thao tác'];",
        "const columns = [t('equipment.columns.id'), t('equipment.columns.name'), t('equipment.columns.code'), t('equipment.columns.location'), t('equipment.columns.description'), t('equipment.columns.room'), t('equipment.columns.status'), t('equipment.columns.actions')];"
    )

    # search
    content = content.replace(
        'placeholder="Tìm thiết bị..."',
        'placeholder={t(\'equipment.searchPlaceholder\')}'
    )
    content = content.replace(
        'Thêm thiết bị',
        "{t('equipment.addBtn')}"
    )

    # Modal
    content = content.replace(
        "title={modal.editing ? 'Cập nhật thiết bị' : 'Thêm thiết bị'}",
        "title={modal.editing ? t('equipment.modal.editTitle') : t('equipment.modal.addTitle')}"
    )
    content = content.replace(
        'Tên thiết bị *',
        "{t('equipment.modal.name')}"
    )
    content = content.replace(
        'placeholder="Điều hòa, TV, tủ lạnh..."',
        'placeholder={t(\'equipment.modal.namePlaceholder\')}'
    )
    content = content.replace(
        'Mã thiết bị *',
        "{t('equipment.modal.code')}"
    )
    content = content.replace(
        'placeholder="TV-101"',
        'placeholder={t(\'equipment.modal.codePlaceholder\')}'
    )
    content = content.replace(
        'Vị trí *',
        "{t('equipment.modal.location')}"
    )
    content = content.replace(
        'placeholder="Phòng 101, kho tầng 2..."',
        'placeholder={t(\'equipment.modal.locationPlaceholder\')}'
    )
    content = content.replace(
        'Gán phòng',
        "{t('equipment.modal.room')}"
    )
    content = content.replace(
        '<option value="">Chưa gán phòng</option>',
        '<option value="">{t(\'equipment.modal.selectRoom\')}</option>'
    )
    content = content.replace(
        'Mô tả',
        "{t('equipment.modal.description')}"
    )
    content = content.replace(
        'Hủy',
        "{t('equipment.modal.cancel')}"
    )
    content = content.replace(
        "{saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Tạo mới'}",
        "{saving ? t('equipment.modal.saving') : modal.editing ? t('equipment.modal.update') : t('equipment.modal.save')}"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def patch_maintenance_manager():
    path = r"e:\HMS\SWP391_Project\frontend\src\components\MaintenanceManager.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import useLocale
    if "import { useLocale }" not in content:
        content = content.replace(
            "import DataTable from './shared/DataTable';",
            "import { useLocale } from '../context/LocaleContext';\nimport DataTable from './shared/DataTable';"
        )

    # Inject t
    content = content.replace(
        "export default function MaintenanceManager({ readOnly = false }) {",
        "export default function MaintenanceManager({ readOnly = false }) {\n  const { t } = useLocale();"
    )

    # Toast & message texts
    content = content.replace(
        "notify('Cập nhật yêu cầu bảo trì thành công!');",
        "notify(t('maintenance.toast.updateSuccess'));"
    )
    content = content.replace(
        "notify('Tạo yêu cầu bảo trì thành công!');",
        "notify(t('maintenance.toast.addSuccess'));"
    )
    content = content.replace(
        "notify(e.status === 403 ? '403 Forbidden - Không có quyền!' : (e.message || 'Lỗi không xác định'), 'error');",
        "notify(e.status === 403 ? t('maintenance.toast.forbidden') : (e.message || t('maintenance.toast.loadError')), 'error');"
    )
    content = content.replace(
        "if (!window.confirm(`Xóa yêu cầu bảo trì #${item.id}?`)) return;",
        "if (!window.confirm(t('maintenance.toast.deleteConfirm', { id: item.id }).replace('{id}', item.id))) return;"
    )
    content = content.replace(
        "notify('Đã xóa yêu cầu bảo trì!');",
        "notify(t('maintenance.toast.deleteSuccess'));"
    )
    content = content.replace(
        "notify(e.status === 403 ? '403 Forbidden - Không có quyền xóa!' : e.message, 'error');",
        "notify(e.status === 403 ? t('maintenance.toast.forbiddenDelete') : e.message, 'error');"
    )

    # Severity & Status rendering in rows
    content = content.replace(
        "{item.severity || 'MEDIUM'}",
        "{t(`maintenance.severity.${item.severity || 'MEDIUM'}`)}"
    )
    content = content.replace(
        "{item.status || 'PENDING'}",
        "{t(`maintenance.status.${item.status || 'PENDING'}`)}"
    )

    # columns
    content = content.replace(
        "const cols = ['#', 'Tiêu Đề', 'Mô Tả', 'Phòng', 'Thiết Bị', 'Báo Cáo Bởi', 'Phân Công', 'Mức Độ', 'Trạng Thái', 'Ngày Tạo', ...(!readOnly ? ['Thao tác'] : [])];",
        "const cols = [t('maintenance.columns.id'), t('maintenance.columns.title'), t('maintenance.columns.description'), t('maintenance.columns.room'), t('maintenance.columns.equipment'), t('maintenance.columns.reportedBy'), t('maintenance.columns.assignedTo'), t('maintenance.columns.severity'), t('maintenance.columns.status'), t('maintenance.columns.createdAt'), ...(!readOnly ? [t('maintenance.columns.actions')] : [])];"
    )

    # Empty text & Add btn
    content = content.replace(
        'emptyText="Không có yêu cầu bảo trì."',
        'emptyText={t(\'maintenance.emptyText\')}'
    )
    content = content.replace(
        'Tạo yêu cầu',
        "{t('maintenance.addBtn')}"
    )

    # Modal title & inputs
    content = content.replace(
        "title={modal.editing ? 'Cập Nhật Yêu Cầu Bảo Trì' : 'Tạo Yêu Cầu Bảo Trì'}",
        "title={modal.editing ? t('maintenance.modal.editTitle') : t('maintenance.modal.addTitle')}"
    )
    content = content.replace(
        'Phân Công Cho',
        "{t('maintenance.modal.assignedTo')}"
    )
    content = content.replace(
        'Mức Độ *',
        "{t('maintenance.modal.severity')}"
    )
    content = content.replace(
        'Trạng Thái *',
        "{t('maintenance.modal.status')}"
    )
    content = content.replace(
        'Chẩn Đoán',
        "{t('maintenance.modal.diagnosis')}"
    )
    content = content.replace(
        'Kết Quả Sửa Chữa',
        "{t('maintenance.modal.repairResult')}"
    )
    content = content.replace(
        'Tiêu Đề Sự Cố *',
        "{t('maintenance.modal.title')}"
    )
    content = content.replace(
        'placeholder="Điều hòa bị hỏng, đường ống rò rỉ..."',
        'placeholder={t(\'maintenance.modal.titlePlaceholder\')}'
    )
    content = content.replace(
        'ID Phòng',
        "{t('maintenance.modal.room')}"
    )
    content = content.replace(
        'ID Thiết Bị',
        "{t('maintenance.modal.equipment')}"
    )
    content = content.replace(
        'Báo Cáo Bởi *',
        "{t('maintenance.modal.reportedBy')}"
    )
    content = content.replace(
        'Mô Tả Chi Tiết',
        "{t('maintenance.modal.description')}"
    )
    content = content.replace(
        '<button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">Hủy</button>',
        '<button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t(\'maintenance.modal.cancel\')}</button>'
    )
    content = content.replace(
        "{saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Tạo mới'}",
        "{saving ? t('maintenance.modal.saving') : modal.editing ? t('maintenance.modal.update') : t('maintenance.modal.save')}"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def patch_staff_manager():
    path = r"e:\HMS\SWP391_Project\frontend\src\components\StaffManager.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import useLocale
    if "import { useLocale }" not in content:
        content = content.replace(
            "import DataTable from './shared/DataTable';",
            "import { useLocale } from '../context/LocaleContext';\nimport DataTable from './shared/DataTable';"
        )

    # Inject t
    content = content.replace(
        "export default function StaffManager() {",
        "export default function StaffManager() {\n  const { t } = useLocale();"
    )

    # Toast errors & confirm
    content = content.replace(
        "notify('Vui lòng nhập mật khẩu cho tài khoản mới!', 'warning');",
        "notify(t('staff.toast.passwordRequired'), 'warning');"
    )
    content = content.replace(
        "notify('Mật khẩu xác nhận không khớp!', 'warning');",
        "notify(t('staff.toast.passwordMismatch'), 'warning');"
    )
    content = content.replace(
        "notify('Cập nhật tài khoản thành công!');",
        "notify(t('staff.toast.updateSuccess'));"
    )
    content = content.replace(
        "notify('Đăng ký tài khoản nhân viên mới thành công!');",
        "notify(t('staff.toast.addSuccess'));"
    )
    content = content.replace(
        "notify(err.message || 'Không thể lưu tài khoản nhân viên.', 'error');",
        "notify(err.message || t('staff.toast.loadError'), 'error');"
    )
    content = content.replace(
        "if (!window.confirm(`Xóa tài khoản \"${item.fullName}\"?`)) return;",
        "if (!window.confirm(t('staff.toast.deleteConfirm', { name: item.fullName }).replace('{name}', item.fullName))) return;"
    )
    content = content.replace(
        "notify('Đã xóa tài khoản nhân viên!');",
        "notify(t('staff.toast.deleteSuccess'));"
    )
    content = content.replace(
        "notify(err.message || 'Không thể xóa tài khoản.', 'error');",
        "notify(err.message || t('staff.toast.loadError'), 'error');"
    )

    # columns list
    content = content.replace(
        "const cols = ['ID', 'Họ Tên', 'Tên Đăng Nhập', 'Email', 'Điện Thoại', 'Vai Trò', 'Trạng Thái', 'Thao tác'];",
        "const cols = [t('staff.columns.id'), t('staff.columns.fullName'), t('staff.columns.username'), t('staff.columns.email'), t('staff.columns.phone'), t('staff.columns.role'), t('staff.columns.status'), t('staff.columns.actions')];"
    )

    # filters dropdown label mappings
    content = content.replace(
        "{STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}",
        "{STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.value === '' ? t('staff.filters.allStatus') : opt.value === 'ACTIVE' ? t('staff.filters.active') : opt.value === 'INACTIVE' ? t('staff.filters.inactive') : opt.value === 'BANNED' ? t('staff.filters.banned') : opt.label}</option>)}"
    )

    # Search placeholder
    content = content.replace(
        'placeholder="Tìm kiếm nhân viên..."',
        'placeholder={t(\'staff.filters.searchPlaceholder\')}'
    )
    content = content.replace(
        'Đăng ký nhân viên',
        "{t('staff.addBtn')}"
    )

    # Modal titles & elements
    content = content.replace(
        "title={modal.editing ? 'Cập Nhật Tài Khoản Nhân Viên' : 'Đăng Ký Tài Khoản Nhân Viên Mới'}",
        "title={modal.editing ? t('staff.modal.editTitle') : t('staff.modal.addTitle')}"
    )
    content = content.replace(
        'Họ và Tên *',
        "{t('staff.modal.fullName')}"
    )
    content = content.replace(
        'Tên Đăng Nhập *',
        "{t('staff.modal.username')}"
    )
    content = content.replace(
        "{modal.editing ? 'Mật Khẩu Mới' : 'Mật Khẩu *'}",
        "{modal.editing ? t('staff.modal.passwordNew') : t('staff.modal.password')}"
    )
    content = content.replace(
        "{modal.editing ? 'Xác Nhận Mật Khẩu Mới' : 'Xác Nhận Mật Khẩu *'}",
        "{modal.editing ? t('staff.modal.confirmPasswordNew') : t('staff.modal.confirmPassword')}"
    )
    content = content.replace(
        'Email *',
        "{t('staff.modal.email')}"
    )
    content = content.replace(
        'Số Điện Thoại *',
        "{t('staff.modal.phone')}"
    )
    content = content.replace(
        'Vai Trò Phân Quyền *',
        "{t('staff.modal.role')}"
    )
    content = content.replace(
        'Trạng Thái *',
        "{t('staff.modal.status')}"
    )
    content = content.replace(
        '<button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">Hủy</button>',
        '<button type="button" onClick={closeModal} className="px-4 py-2 text-sm border border-stone-300 rounded hover:bg-stone-50">{t(\'staff.modal.cancel\')}</button>'
    )
    content = content.replace(
        "{saving ? 'Đang lưu...' : modal.editing ? 'Cập nhật' : 'Đăng ký tài khoản'}",
        "{saving ? t('staff.modal.saving') : modal.editing ? t('staff.modal.update') : t('staff.modal.save')}"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def patch_change_password():
    path = r"e:\HMS\SWP391_Project\frontend\src\components\ChangePassword.jsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import useLocale
    if "import { useLocale }" not in content:
        content = content.replace(
            "import Toast from './shared/Toast';",
            "import { useLocale } from '../context/LocaleContext';\nimport Toast from './shared/Toast';"
        )

    # Inject t
    content = content.replace(
        "export default function ChangePassword() {",
        "export default function ChangePassword() {\n  const { t } = useLocale();"
    )

    # Toast errors & success
    content = content.replace(
        "return notify('Mật khẩu xác nhận không trùng khớp!', 'warning');",
        "return notify(t('changePassword.toast.mismatch'), 'warning');"
    )
    content = content.replace(
        "notify('Thay đổi mật khẩu thành công!');",
        "notify(t('changePassword.toast.success'));"
    )
    content = content.replace(
        "notify(err.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');",
        "notify(err.message || t('changePassword.toast.error'), 'error');"
    )

    # Title & Hint & Form labels
    content = content.replace(
        '<p className="font-semibold">Bảo mật tài khoản</p>',
        '<p className="font-semibold">{t(\'changePassword.title\')}</p>'
    )
    content = content.replace(
        '<p>Mật khẩu mới phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.</p>',
        '<p>{t(\'changePassword.hint\')}</p>'
    )
    content = content.replace(
        'Mật khẩu hiện tại *',
        "{t('changePassword.oldPassword')}"
    )
    content = content.replace(
        'Mật khẩu mới *',
        "{t('changePassword.newPassword')}"
    )
    content = content.replace(
        'Xác nhận mật khẩu mới *',
        "{t('changePassword.confirmPassword')}"
    )
    content = content.replace(
        "{loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}",
        "{loading ? t('changePassword.updating') : t('changePassword.submitBtn')}"
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


if __name__ == "__main__":
    patch_booking_manager()
    patch_equipment_manager()
    patch_maintenance_manager()
    patch_staff_manager()
    patch_change_password()
    print("Successfully patched remaining managers!")

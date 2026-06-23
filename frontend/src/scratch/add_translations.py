def main():
    path = r"e:\HMS\SWP391_Project\frontend\src\i18n\translations.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace('\r\n', '\n')

    vi_insertion = """,
    common: {
      noData: 'Không có dữ liệu.',
      loading: 'Đang tải...',
      page: 'Trang',
    },
    equipment: {
      columns: {
        id: 'ID',
        name: 'Tên thiết bị',
        code: 'Mã thiết bị',
        location: 'Vị trí',
        description: 'Mô tả',
        room: 'Phòng',
        status: 'Trạng thái',
        actions: 'Thao tác',
      },
      status: {
        ACTIVE: 'Hoạt động',
        MAINTENANCE: 'Bảo trì',
        BROKEN: 'Hỏng',
        INACTIVE: 'Ngừng dùng',
      },
      noRoom: 'Chưa gán',
      noRoomOption: 'Chưa gán phòng',
      searchPlaceholder: 'Tìm thiết bị...',
      addBtn: 'Thêm thiết bị',
      modal: {
        addTitle: 'Thêm thiết bị mới',
        editTitle: 'Cập nhật thiết bị',
        name: 'Tên thiết bị *',
        namePlaceholder: 'Điều hòa, TV, tủ lạnh...',
        code: 'Mã thiết bị *',
        codePlaceholder: 'TV-101',
        location: 'Vị trí *',
        locationPlaceholder: 'Phòng 101, kho tầng 2...',
        room: 'Gán phòng',
        description: 'Mô tả',
        cancel: 'Hủy',
        save: 'Tạo mới',
        update: 'Cập nhật',
        saving: 'Đang lưu...',
      },
      toast: {
        addSuccess: 'Thêm thiết bị thành công!',
        updateSuccess: 'Cập nhật thiết bị thành công!',
        deleteSuccess: 'Đã xóa thiết bị!',
        statusSuccess: 'Cập nhật trạng thái thành công!',
        imageRequired: 'Vui lòng chọn hình ảnh thiết bị!',
        forbidden: '403 Forbidden - Bạn không có quyền!',
        forbiddenDelete: '403 Forbidden - Không có quyền xóa thiết bị!',
        loadError: 'Lỗi tải danh sách thiết bị',
        deleteConfirm: 'Xóa thiết bị "{name}"?',
      }
    },
    maintenance: {
      columns: {
        id: 'ID',
        room: 'ID Phòng',
        equipment: 'ID Thiết Bị',
        title: 'Tiêu Đề',
        reportedBy: 'Người Báo Cáo',
        assignedTo: 'Phân Công',
        severity: 'Mức Độ',
        status: 'Trạng Thái',
        actions: 'Thao tác',
      },
      tabs: {
        all: 'Tất Cả Yêu Cầu',
        mine: 'Yêu Cầu Của Tôi',
      },
      filters: {
        status: 'Trạng Thái',
        severity: 'Mức Độ',
        assignedTo: 'Phân Công',
        roomNumber: 'Số Phòng',
        clear: 'Xóa Bộ Lọc',
        search: 'Tìm Kiếm',
      },
      modal: {
        addTitle: 'Tạo Yêu Cầu Bảo Trì Mới',
        editTitle: 'Cập Nhật Yêu Cầu Bảo Trì',
        title: 'Tiêu Đề Sự Cố *',
        titlePlaceholder: 'Điều hòa bị hỏng, đường ống rò rỉ...',
        room: 'ID Phòng',
        equipment: 'ID Thiết Bị',
        reportedBy: 'Báo Cáo Bởi *',
        assignedTo: 'ID Người Phân Công',
        severity: 'Mức Độ *',
        status: 'Trạng Thái *',
        diagnosis: 'Chẩn Đoán',
        repairResult: 'Kết Quả Sửa Chữa',
        description: 'Mô Tả Chi Tiết',
        cancel: 'Hủy',
        save: 'Tạo mới',
        update: 'Cập nhật',
        saving: 'Đang lưu...',
      },
      toast: {
        addSuccess: 'Tạo yêu cầu bảo trì thành công!',
        updateSuccess: 'Cập nhật yêu cầu bảo trì thành công!',
        deleteSuccess: 'Đã xóa yêu cầu bảo trì!',
        forbidden: '403 Forbidden - Bạn không có quyền!',
        forbiddenDelete: '403 Forbidden - Không có quyền xóa!',
        loadError: 'Không thể tải dữ liệu bảo trì.',
        deleteConfirm: 'Xóa yêu cầu bảo trì ID {id}?',
      }
    },
    staff: {
      columns: {
        id: 'ID',
        fullName: 'Họ và tên',
        username: 'Tên đăng nhập',
        email: 'Email',
        phone: 'Số điện thoại',
        role: 'Vai trò',
        status: 'Trạng thái',
        actions: 'Thao tác',
      },
      filters: {
        searchPlaceholder: 'Tìm kiếm nhân viên...',
        allStatus: 'Tất cả trạng thái',
        active: 'Hoạt động',
        inactive: 'Ngừng hoạt động',
        banned: 'Bị khóa',
      },
      addBtn: 'Đăng ký nhân viên',
      modal: {
        addTitle: 'Đăng Ký Tài Khoản Nhân Viên Mới',
        editTitle: 'Cập Nhật Tài Khoản Nhân Viên',
        fullName: 'Họ và Tên *',
        username: 'Tên Đăng Nhập *',
        password: 'Mật Khẩu *',
        passwordNew: 'Mật Khẩu Mới',
        confirmPassword: 'Xác Nhận Mật Khẩu *',
        confirmPasswordNew: 'Xác Nhận Mật Khẩu Mới',
        email: 'Email *',
        phone: 'Số Điện Thoại *',
        role: 'Vai Trò Phân Quyền *',
        status: 'Trạng Thái *',
        cancel: 'Hủy',
        save: 'Đăng ký tài khoản',
        update: 'Cập nhật',
        saving: 'Đang lưu...',
      },
      toast: {
        addSuccess: 'Đăng ký tài khoản nhân viên thành công!',
        updateSuccess: 'Cập nhật tài khoản nhân viên thành công!',
        deleteSuccess: 'Đã xóa tài khoản nhân viên!',
        forbidden: '403 Forbidden - Bạn không có quyền!',
        forbiddenDelete: '403 Forbidden - Không có quyền xóa nhân viên!',
        loadError: 'Lỗi tải danh sách nhân viên.',
        deleteConfirm: 'Bạn có chắc chắn muốn xóa nhân viên "{name}"?',
      }
    },
    changePassword: {
      title: 'Bảo mật tài khoản',
      hint: 'Mật khẩu mới phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số.',
      oldPassword: 'Mật khẩu hiện tại *',
      newPassword: 'Mật khẩu mới *',
      confirmPassword: 'Xác nhận mật khẩu mới *',
      submitBtn: 'Đổi mật khẩu',
      updating: 'Đang cập nhật...',
      toast: {
        mismatch: 'Mật khẩu xác nhận không trùng khớp!',
        success: 'Thay đổi mật khẩu thành công!',
        error: 'Có lỗi xảy ra, vui lòng thử lại.',
      }
    }"""

    en_insertion = """,
    common: {
      noData: 'No data available.',
      loading: 'Loading...',
      page: 'Page',
    },
    equipment: {
      columns: {
        id: 'ID',
        name: 'Equipment Name',
        code: 'Equipment Code',
        location: 'Location',
        description: 'Description',
        room: 'Room',
        status: 'Status',
        actions: 'Actions',
      },
      status: {
        ACTIVE: 'Active',
        MAINTENANCE: 'Maintenance',
        BROKEN: 'Broken',
        INACTIVE: 'Inactive',
      },
      noRoom: 'Unassigned',
      noRoomOption: 'Unassigned room',
      searchPlaceholder: 'Search equipment...',
      addBtn: 'Add Equipment',
      modal: {
        addTitle: 'Add Equipment',
        editTitle: 'Update Equipment',
        name: 'Equipment Name *',
        namePlaceholder: 'Air conditioner, TV, fridge...',
        code: 'Equipment Code *',
        codePlaceholder: 'TV-101',
        location: 'Location *',
        locationPlaceholder: 'Room 101, 2nd floor warehouse...',
        room: 'Assign Room',
        description: 'Description',
        cancel: 'Cancel',
        save: 'Create New',
        update: 'Update',
        saving: 'Saving...',
      },
      toast: {
        addSuccess: 'Equipment added successfully!',
        updateSuccess: 'Equipment updated successfully!',
        deleteSuccess: 'Equipment deleted successfully!',
        statusSuccess: 'Status updated successfully!',
        imageRequired: 'Please select an equipment image!',
        forbidden: '403 Forbidden - Access denied!',
        forbiddenDelete: '403 Forbidden - No permission to delete equipment!',
        loadError: 'Failed to load equipment list',
        deleteConfirm: 'Delete equipment "{name}"?',
      }
    },
    maintenance: {
      columns: {
        id: 'ID',
        room: 'Room ID',
        equipment: 'Equipment ID',
        title: 'Title',
        reportedBy: 'Reported By',
        assignedTo: 'Assigned To',
        severity: 'Severity',
        status: 'Status',
        actions: 'Actions',
      },
      tabs: {
        all: 'All Requests',
        mine: 'My Requests',
      },
      filters: {
        status: 'Status',
        severity: 'Severity',
        assignedTo: 'Assigned To',
        roomNumber: 'Room Number',
        clear: 'Clear Filters',
        search: 'Search',
      },
      modal: {
        addTitle: 'Create New Maintenance Request',
        editTitle: 'Update Maintenance Request',
        title: 'Issue Title *',
        titlePlaceholder: 'Broken AC, pipe leakage...',
        room: 'Room ID',
        equipment: 'Equipment ID',
        reportedBy: 'Reported By *',
        assignedTo: 'Assigned To ID',
        severity: 'Severity *',
        status: 'Status *',
        diagnosis: 'Diagnosis',
        repairResult: 'Repair Result',
        description: 'Detailed Description',
        cancel: 'Cancel',
        save: 'Create New',
        update: 'Update',
        saving: 'Saving...',
      },
      toast: {
        addSuccess: 'Maintenance request created successfully!',
        updateSuccess: 'Maintenance request updated successfully!',
        deleteSuccess: 'Maintenance request deleted!',
        forbidden: '403 Forbidden - Access denied!',
        forbiddenDelete: '403 Forbidden - No permission to delete!',
        loadError: 'Failed to load maintenance data.',
        deleteConfirm: 'Delete maintenance request ID {id}?',
      }
    },
    staff: {
      columns: {
        id: 'ID',
        fullName: 'Full Name',
        username: 'Username',
        email: 'Email',
        phone: 'Phone Number',
        role: 'Role',
        status: 'Status',
        actions: 'Actions',
      },
      filters: {
        searchPlaceholder: 'Search staff...',
        allStatus: 'All Statuses',
        active: 'Active',
        inactive: 'Inactive',
        banned: 'Banned',
      },
      addBtn: 'Register Staff',
      modal: {
        addTitle: 'Register New Staff Account',
        editTitle: 'Update Staff Account',
        fullName: 'Full Name *',
        username: 'Username *',
        password: 'Password *',
        passwordNew: 'New Password',
        confirmPassword: 'Confirm Password *',
        confirmPasswordNew: 'Confirm New Password',
        email: 'Email *',
        phone: 'Phone Number *',
        role: 'Assigned Role *',
        status: 'Status *',
        cancel: 'Cancel',
        save: 'Register Account',
        update: 'Update',
        saving: 'Saving...',
      },
      toast: {
        addSuccess: 'Staff registered successfully!',
        updateSuccess: 'Staff account updated successfully!',
        deleteSuccess: 'Staff account deleted!',
        forbidden: '403 Forbidden - Access denied!',
        forbiddenDelete: '403 Forbidden - No permission to delete staff!',
        loadError: 'Failed to load staff list.',
        deleteConfirm: 'Are you sure you want to delete staff "{name}"?',
      }
    },
    changePassword: {
      title: 'Account Security',
      hint: 'New password must be at least 8 characters long, including uppercase, lowercase letters and numbers.',
      oldPassword: 'Current Password *',
      newPassword: 'New Password *',
      confirmPassword: 'Confirm New Password *',
      submitBtn: 'Change Password',
      updating: 'Updating...',
      toast: {
        mismatch: 'Confirm password does not match!',
        success: 'Password changed successfully!',
        error: 'An error occurred, please try again.',
      }
    }"""

    # We search for:
    #       branches: 'Trung tâm khách sạn',
    #     },
    # And replace with insertion
    target_vi = "      branches: 'Trung tâm khách sạn',\n    },"
    if target_vi in content:
        content = content.replace(target_vi, target_vi + vi_insertion)
        print("Inserted vi translations successfully!")
    else:
        print("Error: Could not locate vi insertion target!")

    target_en = "      branches: 'Hotel Centers',\n    },"
    if target_en in content:
        content = content.replace(target_en, target_en + en_insertion)
        print("Inserted en translations successfully!")
    else:
        print("Error: Could not locate en insertion target!")

    content = content.replace('\n', '\r\n')
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Done!")

if __name__ == "__main__":
    main()

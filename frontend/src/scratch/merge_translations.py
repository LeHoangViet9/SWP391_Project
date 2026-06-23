def main():
    path = r"e:\HMS\SWP391_Project\frontend\src\i18n\translations.js"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Normalize line endings to \n for robust matching
    content = content.replace('\r\n', '\n')

    # 1. Merge first "booking" block in vi
    old_vi_booking = """    booking: {
      destination: 'Điểm đến / Khách sạn',
      checkIn: 'Ngày nhận phòng',
      checkOut: 'Ngày trả phòng',
      rooms: 'Số phòng',
      adults: 'Người lớn',
      children: 'Trẻ em',
      promoCode: 'Mã giảm giá',
      promoPlaceholder: 'Nhập mã ưu đãi',
      search: 'Kiểm tra phòng trống',
      selectHotel: 'Chọn khách sạn',
    },"""

    new_vi_booking = """    booking: {
      destination: 'Điểm đến / Khách sạn',
      checkIn: 'Ngày nhận phòng',
      checkOut: 'Ngày trả phòng',
      rooms: 'Số phòng',
      adults: 'Người lớn',
      children: 'Trẻ em',
      promoCode: 'Mã giảm giá',
      promoPlaceholder: 'Nhập mã ưu đãi',
      search: 'Kiểm tra phòng trống',
      selectHotel: 'Chọn khách sạn',
      columns: {
        id: 'Mã Đơn',
        customer: 'Khách Hàng',
        roomType: 'Loại Phòng',
        quantity: 'SL Phòng',
        checkIn: 'Ngày Nhận',
        checkOut: 'Ngày Trả',
        status: 'Trạng Thái',
        totalPrice: 'Tổng Tiền',
        actions: 'Thao tác',
      },
      tabs: {
        today: 'Hôm Nay',
        filter: 'Bộ Lọc Nâng Cao',
        all: 'Tất Cả Đặt Phòng',
      },
      status: {
        PENDING: 'Chờ xử lý',
        CONFIRMED: 'Đã xác nhận',
        CHECKED_IN: 'Đã Check-in',
        CHECKED_OUT: 'Đã Check-out',
        CANCELLED: 'Đã hủy',
        NO_SHOW: 'Không đến',
      },
      overview: {
        checkInToday: 'Nhận Phòng Hôm Nay ({count})',
        checkOutToday: 'Trả Phòng Hôm Nay ({count})',
        noCheckIn: 'Không có lượt nhận phòng hôm nay.',
        noCheckOut: 'Không có lượt trả phòng hôm nay.',
      },
      filters: {
        status: 'Trạng Thái',
        customer: 'Khách Hàng',
        roomType: 'Loại Phòng',
        roomNumber: 'Số Phòng',
        all: '-- Tất cả --',
        clear: 'Xóa Bộ Lọc',
        search: 'Tìm Kiếm',
      },
      modal: {
        addTitle: 'Tạo Đơn Đặt Phòng Mới',
        editTitle: 'Cập Nhật Đơn Đặt Phòng',
        customer: 'Khách Hàng *',
        selectCustomer: '-- Chọn khách hàng --',
        roomType: 'Loại Phòng *',
        selectRoomType: '-- Chọn loại phòng --',
        checkIn: 'Ngày Nhận Phòng *',
        checkOut: 'Ngày Trả Phòng *',
        quantity: 'Số Phòng Đặt *',
        cancel: 'Hủy',
        save: 'Tạo mới',
        update: 'Cập nhật',
        saving: 'Đang lưu...',
      },
      toast: {
        addSuccess: 'Tạo đặt phòng thành công!',
        updateSuccess: 'Cập nhật đặt phòng thành công!',
        deleteSuccess: 'Đã xóa đơn đặt phòng!',
        forbidden: '403 Forbidden - Bạn không có quyền!',
        forbiddenDelete: '403 Forbidden - Không có quyền xóa!',
        forbiddenCreate: 'Bạn không có quyền tạo đặt phòng!',
        forbiddenEdit: 'Bạn không có quyền sửa đơn đặt phòng!',
        loadError: 'Không thể tải dữ liệu.',
        deleteConfirm: 'Xóa đặt phòng ID {id}?',
      }
    },"""

    if old_vi_booking in content:
        content = content.replace(old_vi_booking, new_vi_booking)
        print("Merged first vi booking block successfully!")
    else:
        print("Error: first vi booking block NOT found!")

    # 2. Merge first "booking" block in en
    old_en_booking = """    booking: {
      destination: 'Destination / Hotel',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      rooms: 'Rooms',
      adults: 'Adults',
      children: 'Children',
      promoCode: 'Promo Code',
      promoPlaceholder: 'Enter promo code',
      search: 'Check Availability',
      selectHotel: 'Select hotel',
    },"""

    new_en_booking = """    booking: {
      destination: 'Destination / Hotel',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      rooms: 'Rooms',
      adults: 'Adults',
      children: 'Children',
      promoCode: 'Promo Code',
      promoPlaceholder: 'Enter promo code',
      search: 'Check Availability',
      selectHotel: 'Select hotel',
      columns: {
        id: 'Booking ID',
        customer: 'Customer',
        roomType: 'Room Category',
        quantity: 'Rooms Count',
        checkIn: 'Check-in Date',
        checkOut: 'Check-out Date',
        status: 'Status',
        totalPrice: 'Total Price',
        actions: 'Actions',
      },
      tabs: {
        today: 'Today',
        filter: 'Advanced Filter',
        all: 'All Bookings',
      },
      status: {
        PENDING: 'Pending',
        CONFIRMED: 'Confirmed',
        CHECKED_IN: 'Checked-in',
        CHECKED_OUT: 'Checked-out',
        CANCELLED: 'Cancelled',
        NO_SHOW: 'No-show',
      },
      overview: {
        checkInToday: 'Check-ins Today ({count})',
        checkOutToday: 'Check-outs Today ({count})',
        noCheckIn: 'No check-ins scheduled for today.',
        noCheckOut: 'No check-outs scheduled for today.',
      },
      filters: {
        status: 'Status',
        customer: 'Customer',
        roomType: 'Room Category',
        roomNumber: 'Room Number',
        all: '-- All --',
        clear: 'Clear Filters',
        search: 'Search',
      },
      modal: {
        addTitle: 'Create New Booking',
        editTitle: 'Update Booking Details',
        customer: 'Customer *',
        selectCustomer: '-- Select customer --',
        roomType: 'Room Category *',
        selectRoomType: '-- Select room category --',
        checkIn: 'Check-in Date *',
        checkOut: 'Check-out Date *',
        quantity: 'Rooms Quantity *',
        cancel: 'Cancel',
        save: 'Create New',
        update: 'Update',
        saving: 'Saving...',
      },
      toast: {
        addSuccess: 'Booking created successfully!',
        updateSuccess: 'Booking updated successfully!',
        deleteSuccess: 'Booking record deleted!',
        forbidden: '403 Forbidden - Access Denied!',
        forbiddenDelete: '403 Forbidden - No permission to delete!',
        forbiddenCreate: 'You do not have permission to create bookings!',
        forbiddenEdit: 'You do not have permission to edit bookings!',
        loadError: 'Failed to load data.',
        deleteConfirm: 'Delete booking ID {id}?',
      }
    },"""

    if old_en_booking in content:
        content = content.replace(old_en_booking, new_en_booking)
        print("Merged first en booking block successfully!")
    else:
        print("Error: first en booking block NOT found!")

    # 3. Locate and delete the duplicate blocks by finding index.
    vi_eq_index = content.find("equipment: {")
    if vi_eq_index != -1:
        vi_bk_index = content.rfind("booking: {", 0, vi_eq_index)
        if vi_bk_index != -1:
            block_content = content[vi_bk_index:vi_eq_index]
            if "columns:" in block_content:
                content = content[:vi_bk_index] + content[vi_eq_index:]
                print("Deleted duplicate vi booking block successfully!")
            else:
                print("Error: The booking block before equipment does not contain 'columns:'!")
        else:
            print("Error: Could not find booking block before equipment!")
    else:
        print("Error: Could not find equipment block in translations!")

    # For en: delete duplicate booking block right before second "equipment:"
    en_eq_index = content.find("equipment: {", vi_eq_index + len("equipment: {"))
    if en_eq_index != -1:
        en_bk_index = content.rfind("booking: {", 0, en_eq_index)
        if en_bk_index != -1:
            block_content = content[en_bk_index:en_eq_index]
            if "columns:" in block_content:
                content = content[:en_bk_index] + content[en_eq_index:]
                print("Deleted duplicate en booking block successfully!")
            else:
                print("Error: The en booking block before equipment does not contain 'columns:'!")
        else:
            print("Error: Could not find en booking block before equipment!")
    else:
        print("Error: Could not find second equipment block (en) in translations!")

    # Write back with original line endings (CRLF on Windows)
    content = content.replace('\n', '\r\n')
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done!")

if __name__ == "__main__":
    main()

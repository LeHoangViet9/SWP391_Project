package com.hms.common.enums;

public enum RoomStatus {
    AVAILABLE,      // Phòng trống sẵn sàng
    MAINTENANCE,    // Phòng đang bảo trì
    INACTIVE,       // Phòng đã bị xóa (soft delete)
    RESERVED,
    CLEANING,
    DIRTY,
    OCCUPIED,
    // FIX: Thêm READY để phân biệt phòng đã dọn xong/chờ lễ tân kiểm tra với AVAILABLE.
    READY,
    CHECKOUT_PENDING
}

package com.hms.common.enums;

public enum RoomStatus {
    AVAILABLE,      // Phòng trống sẵn sàng
    OCCUPIED,       // Phòng đã được đặt/có khách
    DIRTY,          // Phòng cần dọn dẹp
    MAINTENANCE,    // Phòng đang bảo trì
    INACTIVE,
    RESERVED,
    CLEANING,
    // FIX: Thêm READY để phân biệt phòng đã dọn xong/chờ lễ tân kiểm tra với AVAILABLE.
    READY,
    OUT_OF_ORDER// Phòng đã bị xóa (soft delete)
}

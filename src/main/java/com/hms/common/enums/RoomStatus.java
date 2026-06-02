package com.hms.common.enums;

public enum RoomStatus {
    AVAILABLE,      // Phòng trống sẵn sàng
    OCCUPIED,       // Phòng đã được đặt/có khách
    DIRTY,          // Phòng cần dọn dẹp
    MAINTENANCE,    // Phòng đang bảo trì
    INACTIVE        // Phòng đã bị xóa (soft delete)
}

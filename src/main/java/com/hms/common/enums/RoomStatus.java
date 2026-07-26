package com.hms.common.enums;

public enum RoomStatus {
    AVAILABLE,      // Available room ready
    MAINTENANCE,    // Room under maintenance
    INACTIVE,       // Room deleted (soft delete)
    RESERVED,
    CLEANING,
    DIRTY,
    OCCUPIED,
    // FIX: Thêm READY để phân biệt room đã dọn xong/chờ lễ tân kiểm tra với AVAILABLE.
    READY,
    CHECKOUT_PENDING
}

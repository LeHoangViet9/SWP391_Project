package com.hms.common.enums;

public enum RoomState {
    AVAILABLE,
    RESERVED,
    OCCUPIED,
    DIRTY,
    CLEANING,
    // FIX: Thêm READY để phân biệt phòng đã dọn xong/chờ lễ tân kiểm tra với AVAILABLE.
    READY,
    OUT_OF_ORDER
}

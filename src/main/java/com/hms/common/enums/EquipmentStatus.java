package com.hms.common.enums;

public enum EquipmentStatus {
    ACTIVE,
    INACTIVE,
    MAINTENANCE,
    BROKEN, // THAY ĐỔI: Thêm trạng thái BROKEN để đồng bộ dữ liệu với DB (Query.sql) và Frontend
}

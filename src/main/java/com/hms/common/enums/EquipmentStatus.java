package com.hms.common.enums;

public enum EquipmentStatus {
    ACTIVE,
    INACTIVE,
    MAINTENANCE,
    BROKEN, // CHANGE: Add BROKEN status to sync data with DB (Query.sql) and Frontend
}

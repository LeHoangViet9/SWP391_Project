package com.hms.common.enums;

public enum BookingStatus {
    PENDING_PAYMENT,
    PENDING_CHECK_IN,
    CHECKED_IN,
    CHECKED_OUT,
    CANCELLED,
    NO_SHOW,
    // Kept so existing database rows can still be read during migration.
    @Deprecated PENDING,
    @Deprecated CONFIRMED
}

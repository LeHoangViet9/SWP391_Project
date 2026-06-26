package com.hms.common.enums;

import java.util.EnumSet;
import java.util.Set;
import java.util.Map;
import java.util.EnumMap;
import java.util.List;

public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CHECKED_IN,
    CHECKED_OUT,
    CANCELLED,
    NO_SHOW;

    public static final List<BookingStatus> ROOM_HOLDING_STATUSES = List.of(
            PENDING,
            CONFIRMED,
            CHECKED_IN
    );

    private static final Map<BookingStatus, Set<BookingStatus>> VALID_TRANSITIONS = new EnumMap<>(BookingStatus.class);

    static {
        VALID_TRANSITIONS.put(PENDING, EnumSet.of(CONFIRMED, CANCELLED));
        VALID_TRANSITIONS.put(CONFIRMED, EnumSet.of(CHECKED_IN, CANCELLED, NO_SHOW));
        VALID_TRANSITIONS.put(CHECKED_IN, EnumSet.of(CHECKED_OUT));
        VALID_TRANSITIONS.put(CHECKED_OUT, EnumSet.noneOf(BookingStatus.class));
        VALID_TRANSITIONS.put(CANCELLED, EnumSet.noneOf(BookingStatus.class));
        VALID_TRANSITIONS.put(NO_SHOW, EnumSet.noneOf(BookingStatus.class));
    }

    public boolean isRoomHolding() {
        return ROOM_HOLDING_STATUSES.contains(this);
    }

    public Set<BookingStatus> getNextValidStatuses() {
        return VALID_TRANSITIONS.getOrDefault(this, EnumSet.noneOf(BookingStatus.class));
    }

    public boolean isValidTransitionTo(BookingStatus nextStatus) {
        return getNextValidStatuses().contains(nextStatus);
    }
}

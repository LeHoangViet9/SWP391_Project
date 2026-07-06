package com.hms.common.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Utility class cho các phép toán liên quan đến thời gian.
 */
public final class TimeUtils {

    private TimeUtils() { }

    /**
     * Tính số đêm giữa 2 mốc thời gian.
     */
    public static long calculateNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        Objects.requireNonNull(checkIn,  "checkIn");
        Objects.requireNonNull(checkOut, "checkOut");
        if (!checkOut.isAfter(checkIn)) return 0L;
        LocalDate inDate  = checkIn.toLocalDate();
        LocalDate outDate = checkOut.toLocalDate();
        long nights = java.time.temporal.ChronoUnit.DAYS.between(inDate, outDate);
        return Math.max(0L, nights);
    }

    /**
     * Tính số đêm tối thiểu là 1 đêm nếu check-out sau check-in trong cùng một ngày.
     */
    public static long calculateNightsMinimumOne(LocalDateTime checkIn, LocalDateTime checkOut) {
        long nights = calculateNights(checkIn, checkOut);
        if (nights == 0 && checkOut.isAfter(checkIn)) return 1L;
        return nights;
    }
}
package com.hms.common.utils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Utility class cho các phép toán liên quan đến thời gian.
 */
public final class TimeUtils {

    private TimeUtils() { }

    public static long calculateNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        Objects.requireNonNull(checkIn, "checkIn");
        Objects.requireNonNull(checkOut, "checkOut");
        if (!checkOut.isAfter(checkIn)) {
            return 0L;
        }
        LocalDate inDate = checkIn.toLocalDate();
        LocalDate outDate = checkOut.toLocalDate();
        long nights = ChronoUnit.DAYS.between(inDate, outDate);
        return Math.max(0L, nights);
    }

    public static long calculateNightsMinimumOne(LocalDateTime checkIn, LocalDateTime checkOut) {
        long nights = calculateNights(checkIn, checkOut);
        if (nights == 0 && checkOut.isAfter(checkIn)) {
            return 1L;
        }
        return nights;
    }

    public static long calculateHoursBetween(LocalDateTime from, LocalDateTime to) {
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to, "to");
        if (!to.isAfter(from)) {
            return 0L;
        }
        return ChronoUnit.HOURS.between(from, to);
    }

    public static String formatDuration(LocalDateTime from, LocalDateTime to) {
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to, "to");
        if (!to.isAfter(from)) {
            return "0m";
        }
        Duration d = Duration.between(from, to);
        long days = d.toDays();
        long hours = d.minusDays(days).toHours();
        long minutes = d.minusDays(days).minusHours(hours).toMinutes();
        StringBuilder sb = new StringBuilder();
        if (days > 0) sb.append(days).append('d');
        if (hours > 0) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(hours).append('h');
        }
        if (minutes > 0) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(minutes).append('m');
        }
        return sb.length() == 0 ? "0m" : sb.toString();
    }

    public static long calculateLateCheckoutHours(LocalDateTime checkout, LocalTime standardCheckoutTime) {
        Objects.requireNonNull(checkout, "checkout");
        Objects.requireNonNull(standardCheckoutTime, "standardCheckoutTime");
        LocalDateTime standard = LocalDateTime.of(checkout.toLocalDate(), standardCheckoutTime);
        if (!checkout.isAfter(standard)) return 0L;
        long hours = ChronoUnit.HOURS.between(standard, checkout);
        return Math.max(0L, hours);
    }

}


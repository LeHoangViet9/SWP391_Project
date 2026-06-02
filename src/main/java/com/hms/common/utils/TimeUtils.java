package com.hms.common.utils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.Objects;

/**
 * Utility class cho các phép toán liên quan đến thời gian.
 */
public final class TimeUtils {

    private static final int ROUND_DOWN_THRESHOLD  = 30;
    private static final int MINUTES_PER_HOUR = 60;

    private TimeUtils() { }

    public static long calculateNights(LocalDateTime checkIn, LocalDateTime checkOut) {
        Objects.requireNonNull(checkIn,  "checkIn");
        Objects.requireNonNull(checkOut, "checkOut");
        if (!checkOut.isAfter(checkIn)) return 0L;
        LocalDate inDate  = checkIn.toLocalDate();
        LocalDate outDate = checkOut.toLocalDate();
        long nights = java.time.temporal.ChronoUnit.DAYS.between(inDate, outDate);
        return Math.max(0L, nights);
    }

    public static long calculateNightsMinimumOne(LocalDateTime checkIn, LocalDateTime checkOut) {
        long nights = calculateNights(checkIn, checkOut);
        if (nights == 0 && checkOut.isAfter(checkIn)) return 1L;
        return nights;
    }


    public static long calculateHoursBetween(LocalDateTime from, LocalDateTime to) {
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to,   "to");
        if (!to.isAfter(from)) return 0L;
        long hours = Duration.between(from, to).toHours();
        if (hours > 720L) {
            throw new IllegalArgumentException(
                    "Khoảng thời gian vượt giới hạn 30 ngày: " + hours + " giờ");
        }
        return hours;
    }


    public static Map<String, String> formatDuration(LocalDateTime from, LocalDateTime to) {
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to,   "to");

        if (!to.isAfter(from)) {
            return Map.of(
                    "en", "0 minutes",
                    "vi", "0 phút"
            );
        }
        Duration d       = Duration.between(from, to);
        long totalMinutes = d.toMinutes();
        long days         = totalMinutes / (24 * 60);
        long remainMins   = totalMinutes % (24 * 60);

        return Map.of(
                "en", buildDurationEn(days, remainMins),
                "vi", buildDurationVi(days, remainMins)
        );
    }


    private static String buildDurationEn(long days, long minutes) {
        if (days == 0 && minutes == 0) return "0 minutes";
        StringBuilder sb = new StringBuilder();
        if (days > 0) {
            sb.append(days).append(days == 1 ? " day" : " days");
        }
        if (minutes > 0) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(minutes).append(minutes == 1 ? " minute" : " minutes");
        }
        return sb.toString();
    }

    private static String buildDurationVi(long days, long minutes) {
        if (days == 0 && minutes == 0) return "0 phút";
        StringBuilder sb = new StringBuilder();
        if (days > 0) {
            sb.append(days).append(" ngày");
        }
        if (minutes > 0) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(minutes).append(" phút");
        }
        return sb.toString();
    }


    public record LateCheckoutResult(long fullHours, boolean halfHour) {

        public double totalHours() {
            return fullHours + (halfHour ? 0.5 : 0.0);
        }

        public String toStringEn() {
            if (fullHours == 0 && !halfHour) return "0 hours late";
            String val = halfHour
                    ? (fullHours + ".5")
                    : String.valueOf(fullHours);
            String unit = (fullHours == 1 && !halfHour) ? "hour" : "hours";
            return val + " " + unit + " late";
        }

        public String toStringVi() {
            if (fullHours == 0 && !halfHour) return "Không trễ";
            String val = halfHour
                    ? (fullHours + ".5")
                    : String.valueOf(fullHours);
            return "Trễ " + val + " giờ";
        }
    }

    public static LateCheckoutResult calculateLateCheckoutHours(
            LocalDateTime checkout, LocalTime standardCheckoutTime) {

        Objects.requireNonNull(checkout,             "checkout");
        Objects.requireNonNull(standardCheckoutTime, "standardCheckoutTime");

        LocalDateTime standard = LocalDateTime.of(checkout.toLocalDate(), standardCheckoutTime);
        if (!checkout.isAfter(standard)) return new LateCheckoutResult(0L, false);

        long totalLateMinutes = Duration.between(standard, checkout).toMinutes();
        long fullHours        = totalLateMinutes / MINUTES_PER_HOUR;
        long remainMins       = totalLateMinutes % MINUTES_PER_HOUR;

        if (remainMins < ROUND_DOWN_THRESHOLD) {
            return new LateCheckoutResult(fullHours, false);
        } else {
            return new LateCheckoutResult(fullHours, true);
        }
    }

}
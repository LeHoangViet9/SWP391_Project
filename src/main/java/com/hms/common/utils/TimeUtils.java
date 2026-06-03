package com.hms.common.utils;

import org.springframework.context.MessageSource;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * Utility class cho các phép toán liên quan đến thời gian.
 */
public final class TimeUtils {

    private static final int ROUND_DOWN_THRESHOLD  = 30;
    private static final int MINUTES_PER_HOUR = 60;

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

    /**
     * Tính số giờ giữa 2 thời điểm. Giới hạn tối đa 30 ngày (720 giờ).
     * Nếu vượt quá, ném ra IllegalArgumentException chứa mã lỗi (số giờ lỗi).
     */
    public static long calculateHoursBetween(LocalDateTime from, LocalDateTime to) {
        Objects.requireNonNull(from, "from");
        Objects.requireNonNull(to,   "to");
        if (!to.isAfter(from)) return 0L;

        long hours = Duration.between(from, to).toHours();
        if (hours > 720L) {
            // Ném ra chuỗi số giờ lỗi để GlobalExceptionHandler tự dịch đa ngôn ngữ
            throw new IllegalArgumentException(String.valueOf(hours));
        }
        return hours;
    }

    /**
     * Định dạng khoảng thời gian cố định trả về Map tĩnh (giữ lại từ code cũ của bạn).
     */
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

    /**
     * Record lưu kết quả tính toán Check-out trễ, hỗ trợ dịch đa ngôn ngữ động từ file Resource Bundle.
     */
    public record LateCheckoutResult(long fullHours, boolean halfHour) {

        public double totalHours() {
            return fullHours + (halfHour ? 0.5 : 0.0);
        }

        /**
         * Lấy câu thông báo trả về dựa trên ngôn ngữ (Locale) đang chọn của hệ thống.
         */
        public String getLocalizedMessage(MessageSource messageSource, Locale locale) {
            if (fullHours == 0 && !halfHour) {
                return messageSource.getMessage("checkout.late.not_late", null, locale);
            }

            // Định dạng chuỗi số giờ trễ phát sinh (Ví dụ: 2 hoặc 2.5)
            String timeVal = halfHour ? (fullHours + ".5") : String.valueOf(fullHours);

            // Đẩy giá trị timeVal vào vị trí placeholder {0} trong file .properties
            return messageSource.getMessage("checkout.late.msg", new Object[]{timeVal}, locale);
        }
    }

    /**
     * Tính toán số giờ trả phòng trễ dựa trên mốc giờ quy định tiêu chuẩn của khách sạn.
     */
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
package com.hms.common.utils;

import com.hms.common.dto.PageResponse;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Utility class cho các phép toán liên quan đến tính tiền.
 */
public final class BillingUtils {

    private static final int SCALE              = 2;
    private static final int INTERMEDIATE_SCALE = 6;
    private static final int        HOURS_PER_DAY        = 24;
    private static final BigDecimal HUNDRED              = BigDecimal.valueOf(100);
    private static final BigDecimal DEPOSIT_RATE         = new BigDecimal("0.50");

    private BillingUtils() { }

    private static BigDecimal requireNonNegative(BigDecimal value, String name) {
        Objects.requireNonNull(value, name + " không được null");
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(name + " không được âm: " + value);
        }
        return value;
    }

    private static long requirePositive(long value, String name) {
        if (value <= 0) {
            throw new IllegalArgumentException(name + " phải là số nguyên dương, nhận được: " + value);
        }
        return value;
    }

    private static BigDecimal requireValidPercent(BigDecimal percent, String name) {
        Objects.requireNonNull(percent, name + " không được null");
        if (percent.compareTo(BigDecimal.ZERO) < 0 || percent.compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException(
                    name + " phải trong khoảng [0, 100], nhận được: " + percent);
        }
        return percent;
    }

    public static BigDecimal calculateRoomChargePerNight(BigDecimal ratePerNight, long nights) {
        requireNonNegative(ratePerNight, "ratePerNight");
        requirePositive(nights, "nights");
        return ratePerNight
                .multiply(BigDecimal.valueOf(nights))
                .setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateProratedHourlyCharge(BigDecimal ratePerNight, long hours) {
        requireNonNegative(ratePerNight, "ratePerNight");
        requirePositive(hours, "hours");
        BigDecimal hourlyRate = ratePerNight.divide(
                BigDecimal.valueOf(HOURS_PER_DAY), INTERMEDIATE_SCALE, RoundingMode.HALF_UP);
        return hourlyRate
                .multiply(BigDecimal.valueOf(hours))
                .setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateTax(BigDecimal amount, BigDecimal taxPercent) {
        requireNonNegative(amount, "amount");
        if (taxPercent == null) return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        requireValidPercent(taxPercent, "taxPercent");
        return amount
                .multiply(taxPercent)
                .divide(HUNDRED, SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateTotalAmount(
            BigDecimal baseAmount,
            BigDecimal taxPercent,
            BigDecimal discountAmount,
            BigDecimal discountPercent
    ) {
        requireNonNegative(baseAmount, "baseAmount");
        BigDecimal base = baseAmount.setScale(SCALE, RoundingMode.HALF_UP);

        BigDecimal discount = BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        if (discountAmount != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            requireNonNegative(discountAmount, "discountAmount");
            discount = discountAmount.setScale(SCALE, RoundingMode.HALF_UP);
        } else if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            requireValidPercent(discountPercent, "discountPercent");
            discount = base.multiply(discountPercent).divide(HUNDRED, SCALE, RoundingMode.HALF_UP);
        }
        if (discount.compareTo(base) > 0) discount = base;
        BigDecimal taxableAmount = base.subtract(discount);
        BigDecimal tax           = calculateTax(taxableAmount, taxPercent);
        BigDecimal total = taxableAmount.add(tax);

        if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO;
        return total.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateLateCheckoutFee(
            BigDecimal ratePerNight, long lateHours, BigDecimal multiplier) {
        requireNonNegative(ratePerNight, "ratePerNight");
        requirePositive(lateHours, "lateHours");
        if (multiplier == null) multiplier = BigDecimal.ONE;
        requireNonNegative(multiplier, "multiplier");

        BigDecimal hourlyRate = ratePerNight.divide(
                BigDecimal.valueOf(HOURS_PER_DAY), INTERMEDIATE_SCALE, RoundingMode.HALF_UP);
        return hourlyRate
                .multiply(BigDecimal.valueOf(lateHours))
                .multiply(multiplier)
                .setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateRequiredDeposit(BigDecimal totalRoomCharge) {
        requireNonNegative(totalRoomCharge, "totalRoomCharge");
        return totalRoomCharge
                .multiply(DEPOSIT_RATE)
                .setScale(SCALE, RoundingMode.HALF_UP);
    }


    public static boolean isFullyPaid(BigDecimal amountPaid, BigDecimal amountOwed) {
        requireNonNegative(amountPaid, "amountPaid");
        requireNonNegative(amountOwed, "amountOwed");
        return amountPaid.compareTo(amountOwed) >= 0;
    }


    public static boolean isDepositSufficient(BigDecimal depositPaid, BigDecimal totalRoomCharge) {
        BigDecimal required = calculateRequiredDeposit(totalRoomCharge);
        return isFullyPaid(depositPaid, required);
    }


    public static BigDecimal calculateRemainingAmount(BigDecimal amountPaid, BigDecimal amountOwed) {
        requireNonNegative(amountPaid, "amountPaid");
        requireNonNegative(amountOwed, "amountOwed");
        BigDecimal remaining = amountOwed.subtract(amountPaid);
        return remaining.compareTo(BigDecimal.ZERO) < 0
                ? BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP)
                : remaining.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateOverpaidAmount(BigDecimal amountPaid, BigDecimal amountOwed) {
        requireNonNegative(amountPaid, "amountPaid");
        requireNonNegative(amountOwed, "amountOwed");
        BigDecimal overpaid = amountPaid.subtract(amountOwed);
        return overpaid.compareTo(BigDecimal.ZERO) < 0
                ? BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP)
                : overpaid.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static <T> PageResponse<T> toPageResponse(Page<T> page) {
        Objects.requireNonNull(page, "page không được null");
        return PageResponse.<T>builder()
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .content(page.getContent())
                .build();
    }
}
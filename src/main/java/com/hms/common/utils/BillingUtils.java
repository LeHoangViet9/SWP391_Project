package com.hms.common.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Utility class cho các phép toán liên quan đến tính tiền.
 */
public final class BillingUtils {

    private static final int HOURS_PER_DAY = 24;
    private static final int SCALE = 2;

    private BillingUtils() { }

    public static BigDecimal calculateRoomChargePerNights(BigDecimal ratePerNight, long nights) {
        Objects.requireNonNull(ratePerNight, "ratePerNight");
        if (nights <= 0) return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        return ratePerNight.multiply(BigDecimal.valueOf(nights)).setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateProratedHourlyCharge(BigDecimal ratePerNight, long hours) {
        Objects.requireNonNull(ratePerNight, "ratePerNight");
        if (hours <= 0) return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        BigDecimal hourly = ratePerNight.divide(BigDecimal.valueOf(HOURS_PER_DAY), SCALE + 4, RoundingMode.HALF_UP);
        return hourly.multiply(BigDecimal.valueOf(hours)).setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateTax(BigDecimal amount, BigDecimal taxPercent) {
        Objects.requireNonNull(amount, "amount");
        if (taxPercent == null) return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        return amount.multiply(taxPercent).divide(BigDecimal.valueOf(100), SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateTotalAmount(
            BigDecimal baseAmount,
            BigDecimal taxPercent,
            BigDecimal discountAmount,
            BigDecimal discountPercent
    ) {
        Objects.requireNonNull(baseAmount, "baseAmount");
        BigDecimal base = baseAmount.setScale(SCALE, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        if (discountAmount != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            discount = discountAmount.setScale(SCALE, RoundingMode.HALF_UP);
        } else if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            discount = base.multiply(discountPercent).divide(BigDecimal.valueOf(100), SCALE, RoundingMode.HALF_UP);
        }
        BigDecimal tax = calculateTax(base, taxPercent);

        BigDecimal total = base.add(tax).subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        return total.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateLateCheckoutFee(BigDecimal ratePerNight, long lateHours, BigDecimal multiplier) {
        Objects.requireNonNull(ratePerNight, "ratePerNight");
        if (lateHours <= 0) return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        if (multiplier == null) multiplier = BigDecimal.ONE;
        BigDecimal hourly = ratePerNight.divide(BigDecimal.valueOf(HOURS_PER_DAY), SCALE + 4, RoundingMode.HALF_UP);
        BigDecimal fee = hourly.multiply(BigDecimal.valueOf(lateHours)).multiply(multiplier);
        return fee.setScale(SCALE, RoundingMode.HALF_UP);
    }

}



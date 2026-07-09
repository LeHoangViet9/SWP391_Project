package com.hms.common.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Utility class cho các phép toán liên quan đến tính tiền.
 */
public final class BillingUtils {

    private static final int SCALE = 2;

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

    public static BigDecimal calculateRoomChargePerNight(BigDecimal ratePerNight, long nights) {
        requireNonNegative(ratePerNight, "ratePerNight");
        requirePositive(nights, "nights");
        return ratePerNight
                .multiply(BigDecimal.valueOf(nights))
                .setScale(SCALE, RoundingMode.HALF_UP);
    }
}
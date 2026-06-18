package com.hms.dto.booking.response;

import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class InvoiceResponse {
    private Long id;
    private Long bookingId;
    private BigDecimal amount;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private LocalDateTime paidAt;
}

package com.hms.dto.invoice.request;

import com.hms.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReceptionistPaymentRequest {

    @NotNull(message = "Payment method cannot be empty.")
    private PaymentMethod paymentMethod;

    @PositiveOrZero(message = "Amount received from guest cannot be negative.")
    private BigDecimal cashReceived;

    private Boolean paymentConfirmed;
}

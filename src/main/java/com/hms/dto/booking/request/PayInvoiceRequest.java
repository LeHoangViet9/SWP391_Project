package com.hms.dto.booking.request;

import com.hms.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PayInvoiceRequest {

    @NotNull(message = "payment.method.notnull")
    private PaymentMethod paymentMethod;
}

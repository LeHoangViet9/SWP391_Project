package com.hms.dto.invoice.request;

import com.hms.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InvoiceRequest {
    @NotNull(message = "invoice.bookingId.notnull")
    private Long bookingId;
    @NotNull(message = "invoice.additional.chages.notnull")
    private BigDecimal additionalChages;
    @NotNull(message = "invoice.payment_method_notnull")
    private PaymentMethod paymentMethod;
    private String note;
}

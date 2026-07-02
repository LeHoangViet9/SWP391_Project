package com.hms.dto.invoice.request;

import com.hms.common.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReceptionistPaymentRequest {

    @NotNull(message = "Phương thức thanh toán không được để trống.")
    private PaymentMethod paymentMethod;

    @PositiveOrZero(message = "Số tiền nhận từ khách không được âm.")
    private BigDecimal cashReceived;

    private Boolean paymentConfirmed;
}

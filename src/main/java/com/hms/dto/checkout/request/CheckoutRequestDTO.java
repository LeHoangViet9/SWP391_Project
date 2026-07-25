package com.hms.dto.checkout.request;

import com.hms.common.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CheckoutRequestDTO {
    @NotNull
    private Long bookingId;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal additionalCharges = BigDecimal.ZERO;

    private String chargeNote;
    private PaymentMethod paymentMethod;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal cashReceived;

    private Boolean paymentConfirmed = false;

    @AssertTrue(message = "Surcharge notes are required when surcharge is greater than 0")
    public boolean isChargeNoteValid() {
        return additionalCharges == null
                || additionalCharges.signum() == 0
                || (chargeNote != null && !chargeNote.trim().isEmpty());
    }
}

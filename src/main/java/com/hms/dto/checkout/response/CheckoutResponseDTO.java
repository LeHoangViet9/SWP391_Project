package com.hms.dto.checkout.response;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.RoomStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CheckoutResponseDTO {
    private Long bookingId;
    private Long invoiceId;
    private String customerName;
    private List<String> roomNumbers;
    private BigDecimal originalAmount;
    private BigDecimal additionalCharges;
    private BigDecimal amountDue;
    private BigDecimal cashReceived;
    private BigDecimal changeAmount;
    private PaymentStatus paymentStatus;
    private BookingStatus bookingStatus;
    private RoomStatus roomStatus;
    private boolean minibarChecked;
    private String chargeNote;
    private LocalDateTime checkoutTime;
}

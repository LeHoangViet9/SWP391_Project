package com.hms.dto.invoice.response;

import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.entity.booking.Booking;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InvoiceResponse {
    private Long invoiceId;
    private Long bookingId;
    private String customerName;
    private String roomNumber;
    private Long numberOfNights;

    private BigDecimal roomPricePerNight;
    private BigDecimal roomPriceSubTotal;
    private BigDecimal serviceSubTotal;
    private BigDecimal vatAmount;
    private BigDecimal additionalCharges;
    private BigDecimal totalAmount;

    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String note;

    // THÊM: Dữ liệu trả về để Frontend hiển thị QR Code
    private String qrCodeUrl;
    private String paymentContent;


}

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

    // Chi tiết các khoản tiền để hiển thị lên UI
    private BigDecimal roomPricePerNight;
    private BigDecimal roomPriceSubTotal; // Tiền phòng = Giá * Số đêm
    private BigDecimal serviceSubTotal;   // Tổng tiền toàn bộ dịch vụ đã dùng
    private BigDecimal additionalCharges; // Phụ phí
    private BigDecimal totalAmount;       // Tổng số tiền cuối cùng phải trả

    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String note;


}

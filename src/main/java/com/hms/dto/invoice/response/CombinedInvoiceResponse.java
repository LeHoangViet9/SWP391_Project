package com.hms.dto.invoice.response;

import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CombinedInvoiceResponse {
    private String invoiceCode;
    private List<Long> bookingIds;
    private List<InvoiceResponse> items;
    private String customerName;
    private BigDecimal totalAmount;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private BigDecimal cashReceived;
    private BigDecimal changeAmount;
    private Boolean paymentConfirmed;
    private LocalDateTime createdAt;
    private LocalDateTime holdExpiresAt;
    private String qrCodeUrl;
    private String paymentContent;
}

package com.hms.entity.booking;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payos_payments")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PayOSPayment {
    @Id
    private Long orderCode;
    @Column(nullable = false, length = 1000)
    private String bookingIds;
    private String paymentLinkId;
    @Column(length = 1000)
    private String checkoutUrl;
    @Column(length = 4000)
    private String qrCode;
    private String status;
    private LocalDateTime createdAt;
}

package com.hms.dto.booking.response;

import com.hms.common.enums.BookingStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingResponse {
    private Long id;

    private Long customerId;

    private String customerName;

    private Long roomTypeId;

    private String roomTypeName;

    private BigDecimal pricePerNight;

    private Integer quantity;

    private LocalDateTime checkInDate;

    private LocalDateTime checkOutDate;

    private BigDecimal totalPrice;

    private BookingStatus bookingStatus;

    private LocalDateTime createdAt;
}

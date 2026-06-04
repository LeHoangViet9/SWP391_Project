package com.hms.dto.booking.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingRequest {
    @NotNull(message = "{booking.customer.notnull}")
    private Long customerId;

    @NotNull(message = "{booking.roomtype.notnull}")
    private Long roomTypeId;

    @NotNull(message = "{booking.checkin.notnull}")
    private LocalDateTime checkInDate;

    @NotNull(message = "{booking.checkout.notnull}")
    private LocalDateTime checkOutDate;

}

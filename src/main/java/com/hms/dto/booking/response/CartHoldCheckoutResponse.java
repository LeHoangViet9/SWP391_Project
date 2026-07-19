package com.hms.dto.booking.response;

import lombok.Data;

import java.util.List;

@Data
public class CartHoldCheckoutResponse {
    private List<BookingResponse> bookings;
}

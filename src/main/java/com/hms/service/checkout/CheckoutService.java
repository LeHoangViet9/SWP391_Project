package com.hms.service.checkout;

import com.hms.dto.checkout.request.CheckoutRequestDTO;
import com.hms.dto.checkout.response.CheckoutResponseDTO;

public interface CheckoutService {
    CheckoutResponseDTO getBill(Long bookingId);
    CheckoutResponseDTO confirmPayment(CheckoutRequestDTO request, Long userId);
    CheckoutResponseDTO releaseRoom(Long bookingId, Long userId);
    int autoCheckoutOverdueBookings();
}

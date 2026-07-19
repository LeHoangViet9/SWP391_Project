package com.hms.service.booking;

import com.hms.dto.booking.request.CartHoldCheckoutRequest;
import com.hms.dto.booking.request.CartHoldRequest;
import com.hms.dto.booking.response.CartHoldCheckoutResponse;
import com.hms.dto.booking.response.CartHoldResponse;

public interface CartHoldService {
    CartHoldResponse createHold(CartHoldRequest request);

    CartHoldResponse updateHold(String holdToken, CartHoldRequest request);

    CartHoldResponse getHold(String holdToken);

    void cancelHold(String holdToken);

    CartHoldCheckoutResponse checkout(String holdToken, CartHoldCheckoutRequest request);

    void expireHolds();
}

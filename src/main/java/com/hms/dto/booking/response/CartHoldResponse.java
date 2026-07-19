package com.hms.dto.booking.response;

import com.hms.common.enums.CartHoldStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CartHoldResponse {
    private String holdToken;
    private CartHoldStatus status;
    private LocalDateTime expiresAt;
    private List<CartHoldItemResponse> items;
}

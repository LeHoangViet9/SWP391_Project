package com.hms.dto.booking.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CartHoldItemResponse {
    private Long id;
    private Long roomTypeId;
    private String roomTypeName;
    private Integer pricePerNight;
    private Integer quantity;
    private LocalDateTime checkInDate;
    private LocalDateTime checkOutDate;
    private List<Long> roomIds;
    private List<String> roomNumbers;
}

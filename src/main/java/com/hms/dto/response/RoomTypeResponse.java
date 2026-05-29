package com.hms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomTypeResponse {
    private Long id;
    private String typeName;
    private String description;
    private BigDecimal basePrice;
    private Integer maxGuests;
}

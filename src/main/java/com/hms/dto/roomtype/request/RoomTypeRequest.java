package com.hms.dto.roomtype.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RoomTypeRequest {
    @NotBlank(message = "{roomtype.typename.notblank}")
    private String typeName;

    private String description;

    @NotNull(message = "{roomtype.baseprice.notnull}")
    @Positive(message = "{roomtype.baseprice.positive}")
    private BigDecimal basePrice;

    @NotNull(message = "{roomtype.maxguests.notnull}")
    @Min(value =1, message ="{roomtype.maxguests.min}")
    private Integer maxGuests;

}

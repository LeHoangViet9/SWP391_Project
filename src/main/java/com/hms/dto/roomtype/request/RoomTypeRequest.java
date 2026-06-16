package com.hms.dto.roomtype.request;

import jakarta.validation.constraints.Max;
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

    @jakarta.validation.constraints.Size(max = 255, message = "{roomtype.description.size}")
    private String description;

    @NotNull(message = "{roomtype.baseprice.notnull}")
    @Positive(message = "{roomtype.baseprice.positive}")
    @Max(value = 2147483647, message = "{roomtype.baseprice.max}")
    private Integer basePrice;

    @NotNull(message = "{roomtype.maxguests.notnull}")
    @Min(value =1, message ="{roomtype.maxguests.min}")
    @Max(value = 20, message = "{roomtype.maxguests.max}")
    private Integer maxGuests;

}

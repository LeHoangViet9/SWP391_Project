package com.hms.dto.room.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RoomRequest {

    @NotNull(message = "{room.roomtype.notnull}")
    private Long roomTypeId;

    @NotNull(message = "{room.floor.notnull}")
    @Min(value = 1, message = "{room.floor.min}")
    @Max(value = 200, message = "{room.floor.max}")
    private Integer floorNumber;

    @Size(max = 500, message = "{room.description.size}")
    @Pattern(regexp = "^(?!\\s+$)[\\s\\S]*$", message = "{room.description.notblank}")
    private String description;

    private String imageRoom;
}



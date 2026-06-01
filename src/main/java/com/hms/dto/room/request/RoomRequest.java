package com.hms.dto.room.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoomRequest {

    @NotBlank(message = "{room.number.notblank}")
    private String roomNumber;

    @NotNull(message = "{room.roomtype.notnull}")
    private Long roomTypeId;

    @NotNull(message = "{room.status.notnull}")
    private String roomStatus;

    @NotNull(message = "{room.floor.notnull}")
    @Min(value = 1, message = "{room.floor.min}")
    private Integer floorNumber;

    private String description;
}


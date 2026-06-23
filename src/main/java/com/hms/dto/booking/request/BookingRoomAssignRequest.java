package com.hms.dto.booking.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRoomAssignRequest {

    @NotNull(message = "{booking.room.notnull}")
    private Long roomId;
}

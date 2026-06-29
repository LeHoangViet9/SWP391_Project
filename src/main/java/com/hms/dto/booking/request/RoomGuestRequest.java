package com.hms.dto.booking.request;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomGuestRequest {
    @Min(1)
    private Integer adults;

    @Min(0)
    private Integer children;

    @Min(0)
    private Integer infants;
}

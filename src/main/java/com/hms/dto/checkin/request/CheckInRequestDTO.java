package com.hms.dto.checkin.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInRequestDTO {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    // Optional: if receptionist assigns room manually
    private Long roomId;

    // Optional: for self check-in location verification
    private Double latitude;
    private Double longitude;

}

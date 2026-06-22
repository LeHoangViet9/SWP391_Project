package com.hms.dto.checkin.response;

import com.hms.common.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInResponseDTO {

    private Long bookingId;
    private String customerName;
    private String roomNumber;
    private BookingStatus bookingStatus;
    private LocalDateTime checkInTime;
    private String message;

}

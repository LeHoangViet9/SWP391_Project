package com.hms.service.checkin;

import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.AvailableRoomResponseDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;

import java.util.List;

public interface CheckInService {
    CheckInResponseDTO processCheckIn(CheckInRequestDTO request, Long userId);

    List<AvailableRoomResponseDTO> getAvailableRoomsForBooking(Long bookingId);
}

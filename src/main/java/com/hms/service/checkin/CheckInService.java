package com.hms.service.checkin;

import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;
import com.hms.entity.hotel.Room;

import java.util.List;

public interface CheckInService {
    CheckInResponseDTO processCheckIn(CheckInRequestDTO request, Long userId);

    List<Room> getAvailableRoomsForBooking(Long bookingId);
}

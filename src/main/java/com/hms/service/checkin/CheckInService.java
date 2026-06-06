package com.hms.service.checkin;

import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;

public interface CheckInService {
    CheckInResponseDTO processCheckIn(CheckInRequestDTO request, Long userId);
}

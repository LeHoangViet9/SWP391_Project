package com.hms.controller.checkin;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.AvailableRoomResponseDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;
import com.hms.repository.auth.UserRepository;
import com.hms.service.checkin.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/checkin")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('CHECKIN_VIEW') or hasAuthority('BOOKING_UPDATE')")
    public ResponseEntity<ApiResponse<CheckInResponseDTO>> processCheckIn(
            @Valid @RequestBody CheckInRequestDTO request,
            @AuthenticationPrincipal String email) {

        Long userId = userRepository.findUserByEmail(email)
                .map(user -> user.getId())
                .orElse(null);
        CheckInResponseDTO responseDTO = checkInService.processCheckIn(request, userId);

        ApiResponse<CheckInResponseDTO> response = ApiResponse.<CheckInResponseDTO>builder()
                .success(true)
                .message("Check-in processed successfully")
                .data(responseDTO)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/available-rooms/{bookingId}")
    @PreAuthorize("hasAuthority('CHECKIN_VIEW') or hasAuthority('BOOKING_VIEW') or hasAuthority('BOOKING_UPDATE')")
    public ResponseEntity<ApiResponse<List<AvailableRoomResponseDTO>>> getAvailableRooms(@PathVariable Long bookingId) {
        List<AvailableRoomResponseDTO> availableRooms = checkInService.getAvailableRoomsForBooking(bookingId);

        ApiResponse<List<AvailableRoomResponseDTO>> response = ApiResponse.<List<AvailableRoomResponseDTO>>builder()
                .success(true)
                .message("Fetched available rooms successfully")
                .data(availableRooms)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}

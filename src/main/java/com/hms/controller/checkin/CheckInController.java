package com.hms.controller.checkin;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;
import com.hms.entity.hotel.Room;
import com.hms.service.checkin.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/checkin")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping
    public ResponseEntity<ApiResponse<CheckInResponseDTO>> processCheckIn(
            @Valid @RequestBody CheckInRequestDTO request,
            @RequestParam(required = false) Long userId) {

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
    public ResponseEntity<ApiResponse<List<Room>>> getAvailableRooms(@PathVariable Long bookingId) {
        List<Room> availableRooms = checkInService.getAvailableRoomsForBooking(bookingId);

        ApiResponse<List<Room>> response = ApiResponse.<List<Room>>builder()
                .success(true)
                .message("Fetched available rooms successfully")
                .data(availableRooms)
                .status(HttpStatus.OK)
                .build();

        return ResponseEntity.ok(response);
    }
}

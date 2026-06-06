package com.hms.controller.checkin;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;
import com.hms.service.checkin.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/checkin")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping
    public ResponseEntity<ApiResponse<CheckInResponseDTO>> processCheckIn(
            @Valid @RequestBody CheckInRequestDTO request,
            // Assuming we can get user ID from security context later, passing null or mock ID for now
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
}

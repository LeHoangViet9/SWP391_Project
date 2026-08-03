package com.hms.controller.checkin;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.checkin.request.CheckInRequestDTO;
import com.hms.dto.checkin.response.AvailableRoomResponseDTO;
import com.hms.dto.checkin.response.CheckInResponseDTO;
import com.hms.repository.auth.UserRepository;
import com.hms.service.checkin.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/checkin")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;
    private final UserRepository userRepository;
    private final MessageSource messageSource;

    @PostMapping
    @PreAuthorize("hasAuthority('CHECKIN_VIEW') or hasAuthority('BOOKING_UPDATE')")
    public ApiResponse<CheckInResponseDTO> processCheckIn(
            @Valid @RequestBody CheckInRequestDTO request,
            @AuthenticationPrincipal String email) {

        Locale locale = LocaleContextHolder.getLocale();
        Long userId = userRepository.findUserByEmail(email)
                .map(user -> user.getId())
                .orElse(null);

        return ApiResponse.success(
                messageSource.getMessage("checkin.process.success", null, locale),
                checkInService.processCheckIn(request, userId)
        );
    }

    @GetMapping("/available-rooms/{bookingId}")
    @PreAuthorize("hasAuthority('CHECKIN_VIEW') or hasAuthority('BOOKING_VIEW') or hasAuthority('BOOKING_UPDATE')")
    public ApiResponse<List<AvailableRoomResponseDTO>> getAvailableRooms(
            @PathVariable Long bookingId
    ) {
        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage("checkin.available_rooms.success", null, locale),
                checkInService.getAvailableRoomsForBooking(bookingId)
        );
    }
}

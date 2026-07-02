package com.hms.controller.checkout;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.checkout.request.CheckoutRequestDTO;
import com.hms.dto.checkout.response.CheckoutResponseDTO;
import com.hms.repository.auth.UserRepository;
import com.hms.service.checkout.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckoutController {
    private final CheckoutService checkoutService;
    private final UserRepository userRepository;

    @GetMapping("/{bookingId}/bill")
    @PreAuthorize("hasAuthority('CHECKOUT_VIEW') or hasAuthority('CHECKOUT_PROCESS')")
    public ResponseEntity<ApiResponse<CheckoutResponseDTO>> bill(@PathVariable Long bookingId) {
        return ok("Đã tạo hóa đơn check-out", checkoutService.getBill(bookingId));
    }

    @PostMapping("/confirm-payment")
    @PreAuthorize("hasAuthority('CHECKOUT_PROCESS')")
    public ResponseEntity<ApiResponse<CheckoutResponseDTO>> confirmPayment(
            @Valid @RequestBody CheckoutRequestDTO request, @AuthenticationPrincipal String email) {
        return ok("Đã xác nhận thanh toán, phòng đang chờ trả", checkoutService.confirmPayment(request, userId(email)));
    }

    @PostMapping("/{bookingId}/release-room")
    @PreAuthorize("hasAuthority('CHECKOUT_PROCESS')")
    public ResponseEntity<ApiResponse<CheckoutResponseDTO>> release(
            @PathVariable Long bookingId, @AuthenticationPrincipal String email) {
        return ok("Check-out thành công, phòng đã chuyển sang DIRTY", checkoutService.releaseRoom(bookingId, userId(email)));
    }

    private Long userId(String email) {
        return email == null ? null : userRepository.findUserByEmail(email).map(user -> user.getId()).orElse(null);
    }

    private ResponseEntity<ApiResponse<CheckoutResponseDTO>> ok(String message, CheckoutResponseDTO data) {
        return ResponseEntity.ok(ApiResponse.<CheckoutResponseDTO>builder()
                .success(true).message(message).data(data).status(HttpStatus.OK).build());
    }
}

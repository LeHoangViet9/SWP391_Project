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
    @PreAuthorize("hasAuthority('CHECKOUT_VIEW')")
    public ResponseEntity<ApiResponse<CheckoutResponseDTO>> bill(@PathVariable Long bookingId) {
        return ok("Checkout invoice created", checkoutService.getBill(bookingId));
    }

    @PostMapping("/confirm-payment")
    @PreAuthorize("hasAuthority('CHECKOUT_VIEW')")
    public ResponseEntity<ApiResponse<CheckoutResponseDTO>> confirmPayment(
            @Valid @RequestBody CheckoutRequestDTO request, @AuthenticationPrincipal String email) {
        return ok("Payment confirmed, room awaiting checkout", checkoutService.confirmPayment(request, userId(email)));
    }

    @PostMapping("/{bookingId}/release-room")
    @PreAuthorize("hasAuthority('CHECKOUT_VIEW')")
    public ResponseEntity<ApiResponse<CheckoutResponseDTO>> release(
            @PathVariable Long bookingId, @AuthenticationPrincipal String email) {
        return ok("Check-out successful, room status changed to DIRTY", checkoutService.releaseRoom(bookingId, userId(email)));
    }

    private Long userId(String email) {
        return email == null ? null : userRepository.findUserByEmail(email).map(user -> user.getId()).orElse(null);
    }

    private ResponseEntity<ApiResponse<CheckoutResponseDTO>> ok(String message, CheckoutResponseDTO data) {
        return ResponseEntity.ok(ApiResponse.<CheckoutResponseDTO>builder()
                .success(true).message(message).data(data).status(HttpStatus.OK).build());
    }
}

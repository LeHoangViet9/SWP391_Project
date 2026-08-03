package com.hms.controller.checkout;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.checkout.request.CheckoutRequestDTO;
import com.hms.dto.checkout.response.CheckoutResponseDTO;
import com.hms.repository.auth.UserRepository;
import com.hms.service.checkout.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final UserRepository userRepository;
    private final MessageSource messageSource;

    @GetMapping("/{bookingId}/bill")
    @PreAuthorize("hasAuthority('CHECKOUT_VIEW')")
    public ApiResponse<CheckoutResponseDTO> bill(
            @PathVariable Long bookingId
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage(
                        "checkout.bill.success",
                        null,
                        locale
                ),
                checkoutService.getBill(bookingId)
        );
    }

    @PostMapping("/confirm-payment")
    @PreAuthorize("hasAuthority('CHECKOUT_VIEW')")
    public ApiResponse<CheckoutResponseDTO> confirmPayment(
            @Valid @RequestBody CheckoutRequestDTO request,
            @AuthenticationPrincipal String email
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage(
                        "checkout.confirm_payment.success",
                        null,
                        locale
                ),
                checkoutService.confirmPayment(request, userId(email))
        );
    }

    @PostMapping("/{bookingId}/release-room")
    @PreAuthorize("hasAuthority('CHECKOUT_VIEW')")
    public ApiResponse<CheckoutResponseDTO> release(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal String email
    ) {

        Locale locale = LocaleContextHolder.getLocale();

        return ApiResponse.success(
                messageSource.getMessage(
                        "checkout.release_room.success",
                        null,
                        locale
                ),
                checkoutService.releaseRoom(bookingId, userId(email))
        );
    }

    private Long userId(String email) {
        return email == null
                ? null
                : userRepository.findUserByEmail(email)
                .map(user -> user.getId())
                .orElse(null);
    }
}

package com.hms.controller.booking;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.booking.request.CartHoldCheckoutRequest;
import com.hms.dto.booking.request.CartHoldRequest;
import com.hms.dto.booking.response.CartHoldCheckoutResponse;
import com.hms.dto.booking.response.CartHoldResponse;
import com.hms.service.booking.CartHoldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/cart-holds")
@RequiredArgsConstructor
public class CartHoldController {

    private final CartHoldService cartHoldService;
    private final MessageSource messageSource;

    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<CartHoldResponse>> create(@Valid @RequestBody CartHoldRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        return response(cartHoldService.createHold(request), "success.cart.hold.created", HttpStatus.CREATED, locale);
    }

    @PutMapping("/{holdToken}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<CartHoldResponse>> update(
            @PathVariable String holdToken,
            @Valid @RequestBody CartHoldRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        return response(cartHoldService.updateHold(holdToken, request), "success.cart.hold.updated", HttpStatus.OK, locale);
    }

    @GetMapping("/{holdToken}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<CartHoldResponse>> get(@PathVariable String holdToken) {
        Locale locale = LocaleContextHolder.getLocale();
        return response(cartHoldService.getHold(holdToken), "success.cart.hold.get", HttpStatus.OK, locale);
    }

    @DeleteMapping("/{holdToken}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable String holdToken) {
        cartHoldService.cancelHold(holdToken);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Cart hold released")
                .status(HttpStatus.OK)
                .build());
    }

    @PostMapping("/{holdToken}/checkout")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<CartHoldCheckoutResponse>> checkout(
            @PathVariable String holdToken,
            @Valid @RequestBody CartHoldCheckoutRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        return response(cartHoldService.checkout(holdToken, request), "success.cart.hold.checkout", HttpStatus.OK, locale);
    }

    private <T> ResponseEntity<ApiResponse<T>> response(
            T data, String messageKey, HttpStatus status, Locale locale) {
        return ResponseEntity.status(status).body(ApiResponse.<T>builder()
                .success(true)
                .message(messageSource.getMessage(messageKey, null, locale))
                .data(data)
                .status(status)
                .build());
    }
}

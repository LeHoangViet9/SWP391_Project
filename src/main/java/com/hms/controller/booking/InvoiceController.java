package com.hms.controller.booking;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.booking.request.PayInvoiceRequest;
import com.hms.dto.booking.response.InvoiceResponse;
import com.hms.service.booking.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

/**
 * Quản lý hoá đơn và thanh toán.
 * Sau khi thanh toán: phòng chuyển CHECKOUT_PENDING → DIRTY.
 */
@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final MessageSource messageSource;

    /** GET /api/v1/invoices/{id} — Lấy chi tiết hoá đơn */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        InvoiceResponse data = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.invoice.getbyid", null, locale))
                .data(data)
                .status(HttpStatus.OK)
                .build());
    }

    /** GET /api/v1/invoices/booking/{bookingId} — Lấy hoá đơn theo booking */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceByBookingId(@PathVariable Long bookingId) {
        Locale locale = LocaleContextHolder.getLocale();
        InvoiceResponse data = invoiceService.getInvoiceByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.invoice.getbyid", null, locale))
                .data(data)
                .status(HttpStatus.OK)
                .build());
    }

    /**
     * POST /api/v1/invoices/{id}/pay — Thanh toán hoá đơn
     * Body: { "paymentMethod": "CASH" | "CARD" | ... }
     * Sau khi thanh toán: phòng chuyển CHECKOUT_PENDING → DIRTY
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<InvoiceResponse>> payInvoice(
            @PathVariable Long id,
            @Valid @RequestBody PayInvoiceRequest request) {

        Locale locale = LocaleContextHolder.getLocale();
        InvoiceResponse data = invoiceService.payInvoice(id, request.getPaymentMethod());
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message(messageSource.getMessage("success.invoice.paid", null, locale))
                .data(data)
                .status(HttpStatus.OK)
                .build());
    }
}

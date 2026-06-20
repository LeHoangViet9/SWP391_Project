package com.hms.controller.booking;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.exception.BadRequestException;
import com.hms.dto.booking.request.PayInvoiceRequest;

import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import com.hms.service.booking.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

/**
 * Quản lý hoá đơn và thanh toán.
 * Sau khi thanh toán: phòng chuyển CHECKOUT_PENDING → DIRTY.
 */
@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final MessageSource messageSource;
    private final InvoiceService invoiceService;


    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(@Valid @RequestBody InvoiceRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.create.success",null, locale),
                invoiceService.createInvoice(request),
                HttpStatus.CREATED
        ), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> updateInvoice(@Valid @RequestBody InvoiceRequest request, @PathVariable Long id){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.update.success",null, locale),
                invoiceService.updateInvoice(id, request),
                HttpStatus.OK
        ), HttpStatus.OK);
    }
    @PostMapping("/{id}/process-payments")
    public ResponseEntity<ApiResponse<InvoiceResponse>> processInvoice(@RequestBody Map<String, String> body, @PathVariable Long id){
        Locale locale = LocaleContextHolder.getLocale();
        String paymentMethodStr = body.get("paymentMethod");

        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(paymentMethodStr.toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException(messageSource.getMessage("error.payment.method.valid", null, locale));
        }

        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.process.success", null, locale),
                invoiceService.processPayment(id, paymentMethod),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    @PostMapping("/booking/{bookingId}/pending")
    public ResponseEntity<ApiResponse<InvoiceResponse>> pendingInvoice(@PathVariable Long bookingId){
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.pending.success",null, LocaleContextHolder.getLocale()),
                invoiceService.createPendingInvoice(bookingId),
                HttpStatus.OK
        ), HttpStatus.OK);
    }
    @PostMapping("/{id}/mark-as-paid")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markAsPaid(
            @RequestBody Map<String, String> body,
            @PathVariable Long id) {

        Locale locale = LocaleContextHolder.getLocale();
        String paymentMethodStr = body.get("paymentMethod");

        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(paymentMethodStr.toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException(messageSource.getMessage("error.payment.method.valid", null, locale));
        }

        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.update.success", null, locale), // thay bằng message của bạn
                invoiceService.markAsPaid(id, paymentMethod),
                HttpStatus.OK
        ), HttpStatus.OK);
    }



    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> searchInvoices(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") SortDirection direction, Locale locale) {

        Page<InvoiceResponse> result = invoiceService.searchInvoices(
                keyword, status, fromDate, toDate, page, size, sortBy, direction
        );



        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.search.success",null,locale),
                result,
                HttpStatus.OK
        ),HttpStatus.OK);
    }



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

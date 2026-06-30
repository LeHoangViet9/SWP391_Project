package com.hms.controller.booking;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import com.hms.dto.invoice.response.CombinedInvoiceResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.List;

/**
 * Quản lý hoá đơn và thanh toán theo mô hình TRẢ TRƯỚC 100%.
 * Khởi tạo hóa đơn (PENDING) -> Sinh QR -> Khách thanh toán (PAID) -> Booking chờ check-in.
 */
@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final MessageSource messageSource;
    private final InvoiceService invoiceService;

    /**
     * POST /api/v1/invoices — Tạo hóa đơn ban đầu và trả về kèm mã QR động (Trạng thái PENDING)
     */
    @PostMapping
    @PreAuthorize("hasAuthority('INVOICE_CREATE')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(@Valid @RequestBody InvoiceRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.create.success", null, locale),
                invoiceService.createInvoice(request),
                HttpStatus.CREATED
        ), HttpStatus.CREATED);
    }

    /**
     * POST /api/v1/invoices/webhook/payment-success — Endpoint tiếp nhận thông báo thanh toán thành công
     * * Lưu ý quan trọng: Endpoint này thường sẽ được gọi bởi Hệ thống Ngân hàng/Cổng thanh toán (PayOS, Cassso, VietQR)
     * hoặc do Frontend bắn một Request sau khi kiểm tra trạng thái chuyển khoản thành công.
     */
    @PostMapping("/webhook/payment-success/{bookingId}")
    @PreAuthorize("hasAuthority('INVOICE_UPDATE')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> handlePaymentSuccess(@PathVariable Long bookingId) {
        Locale locale = LocaleContextHolder.getLocale();

        InvoiceResponse updatedInvoice = invoiceService.confirmPaymentSuccess(bookingId);

        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .success(true)
                .message(messageSource.getMessage("invoice.payment.success", null, locale))
                .data(updatedInvoice)
                .status(HttpStatus.OK)
                .build());
    }

    /** GET /api/v1/invoices/search — Tìm kiếm nâng cao và phân trang hóa đơn */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> searchInvoices(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") SortDirection direction) {

        Locale locale = LocaleContextHolder.getLocale();
        Page<InvoiceResponse> result = invoiceService.searchInvoices(
                keyword, status, fromDate, toDate, page, size, sortBy, direction
        );

        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.search.success", null, locale),
                result,
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    /** Một hóa đơn thanh toán chung cho nhiều booking trong cùng giỏ hàng. */
    @GetMapping("/batch")
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
    public ResponseEntity<ApiResponse<CombinedInvoiceResponse>> getCombinedInvoice(
            @RequestParam List<Long> bookingIds) {
        return ResponseEntity.ok(ApiResponse.<CombinedInvoiceResponse>builder()
                .success(true)
                .message("Combined invoice retrieved successfully")
                .data(invoiceService.getCombinedInvoice(bookingIds))
                .status(HttpStatus.OK)
                .build());
    }

    /** Xác nhận một giao dịch và cập nhật toàn bộ booking thuộc hóa đơn tổng. */
    @PostMapping("/batch/webhook/payment-success")
    @PreAuthorize("hasAuthority('INVOICE_UPDATE')")
    public ResponseEntity<ApiResponse<CombinedInvoiceResponse>> handleCombinedPaymentSuccess(
            @RequestParam List<Long> bookingIds) {
        return ResponseEntity.ok(ApiResponse.<CombinedInvoiceResponse>builder()
                .success(true)
                .message("Combined invoice payment completed successfully")
                .data(invoiceService.confirmCombinedPaymentSuccess(bookingIds))
                .status(HttpStatus.OK)
                .build());
    }

    /** GET /api/v1/invoices/{id} — Lấy chi tiết hoá đơn */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
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
    @PreAuthorize("hasAuthority('INVOICE_VIEW')")
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
}

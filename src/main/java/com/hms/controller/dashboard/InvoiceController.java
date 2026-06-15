package com.hms.controller.dashboard;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import com.hms.service.dashboard.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.http.parser.HttpParser;
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

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceService invoiceService;
    private final MessageSource messageSource;

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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(@PathVariable Long id){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.get.success",null, locale),
                invoiceService.getInvoice(id),
                HttpStatus.OK
        ), HttpStatus.OK);
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
        String paymentMethod = body.get("paymentMethod");
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("invoice.process.success",null, locale),
                invoiceService.processPayment(id,paymentMethod),
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
}

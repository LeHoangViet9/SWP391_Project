package com.hms.service.booking;

import com.fasterxml.jackson.databind.JsonNode;
import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface InvoiceService {

    /** Đánh dấu Invoice là đã thanh toán */

    InvoiceResponse createInvoice(InvoiceRequest request);

    Page<InvoiceResponse> searchInvoices(
            String keyword,
            PaymentStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Integer page,
            Integer size,
            String sortBy,
            SortDirection direction
    );


    /** Lấy hoá đơn theo booking */
    InvoiceResponse getInvoiceByBookingId(Long bookingId);

    /** Lấy hoá đơn theo id */
    InvoiceResponse getInvoiceById(Long invoiceId);

    InvoiceResponse confirmPaymentSuccess(Long bookingId);

    InvoiceResponse markInvoicePaid(Long invoiceId, PaymentMethod paymentMethod);

    InvoiceResponse createPayOsPaymentLink(Long invoiceId);

    InvoiceResponse syncPayOsPaymentStatus(Long orderCode);

    InvoiceResponse handlePayOsWebhook(JsonNode webhookBody);
}

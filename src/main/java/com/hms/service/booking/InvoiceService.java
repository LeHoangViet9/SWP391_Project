package com.hms.service.booking;

import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface InvoiceService {
    InvoiceResponse createPendingInvoice(Long bookingId);

    /** Đánh dấu Invoice là đã thanh toán */
    InvoiceResponse markAsPaid(Long invoiceId, PaymentMethod paymentMethod);

    InvoiceResponse createInvoice(InvoiceRequest request);
    InvoiceResponse updateInvoice(Long id, InvoiceRequest request);
    InvoiceResponse processPayment(Long id, PaymentMethod paymentMethod);

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

    InvoiceResponse payInvoice(Long invoiceId, PaymentMethod paymentMethod);

    /** Lấy hoá đơn theo booking */
    InvoiceResponse getInvoiceByBookingId(Long bookingId);

    /** Lấy hoá đơn theo id */
    InvoiceResponse getInvoiceById(Long invoiceId);
}

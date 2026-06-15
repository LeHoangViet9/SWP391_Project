package com.hms.service.dashboard;

import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface InvoiceService {
    InvoiceResponse createInvoice(InvoiceRequest request);
    InvoiceResponse getInvoice(Long id);
    InvoiceResponse updateInvoice(Long id,InvoiceRequest request);
    InvoiceResponse processPayment(Long id,String paymentMethod);

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
}

package com.hms.service.booking;

import com.hms.common.enums.PaymentMethod;
import com.hms.entity.booking.Invoice;

public interface InvoiceService {

    /** Tạo Invoice PENDING khi booking chuyển sang CONFIRMED */
    Invoice createPendingInvoice(Long bookingId);

    /** Đánh dấu Invoice là đã thanh toán */
    Invoice markAsPaid(Long invoiceId, PaymentMethod paymentMethod);
}

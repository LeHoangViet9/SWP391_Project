package com.hms.service.booking;

import com.hms.common.enums.PaymentMethod;
import com.hms.dto.booking.response.InvoiceResponse;

public interface InvoiceService {

    /**
     * Xử lý thanh toán hoá đơn.
     * Sau khi thanh toán thành công:
     *   - Invoice → PAID
     *   - Phòng:  CHECKOUT_PENDING → DIRTY  (housekeeping cần dọn)
     *   - Booking vẫn giữ CHECKED_OUT
     */
    InvoiceResponse payInvoice(Long invoiceId, PaymentMethod paymentMethod);

    /** Lấy hoá đơn theo booking */
    InvoiceResponse getInvoiceByBookingId(Long bookingId);

    /** Lấy hoá đơn theo id */
    InvoiceResponse getInvoiceById(Long invoiceId);
}

package com.hms.service.booking.impl;

import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.Invoice;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.service.booking.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final MessageSource messageSource;

    @Override
    @Transactional
    public Invoice createPendingInvoice(Long bookingId) {
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.booking.notfound", null, locale)));

        // Không tạo trùng nếu đã có invoice
        if (booking.getInvoice() != null) {
            return booking.getInvoice();
        }

        Invoice invoice = Invoice.builder()
                .booking(booking)
                .amount(booking.getTotalPrice())
                .paymentStatus(PaymentStatus.PENDING)
                .build();

        return invoiceRepository.save(invoice);
    }

    @Override
    @Transactional
    public Invoice markAsPaid(Long invoiceId, PaymentMethod paymentMethod) {
        Locale locale = LocaleContextHolder.getLocale();

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.invoice.notfound", null, locale)));

        if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException(
                    messageSource.getMessage("error.invoice.already.paid", null, locale));
        }

        invoice.setPaymentStatus(PaymentStatus.PAID);
        invoice.setPaymentMethod(paymentMethod);
        invoice.setPaidAt(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }
}

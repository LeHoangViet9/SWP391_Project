package com.hms.service.booking.impl;

import com.hms.common.enums.PaymentMethod;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.booking.response.InvoiceResponse;
import com.hms.entity.booking.Invoice;
import com.hms.entity.hotel.Room;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.hotel.RoomRepository;
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
public class PaymentInvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final MessageSource messageSource;

    @Override
    @Transactional
    public InvoiceResponse payInvoice(Long invoiceId, PaymentMethod paymentMethod) {
        Locale locale = LocaleContextHolder.getLocale();

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.invoice.notfound", null, locale)));

        if (invoice.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException(
                    messageSource.getMessage("error.invoice.already.paid", null, locale));
        }

        // 1. Đánh dấu hoá đơn là đã thanh toán
        invoice.setPaymentStatus(PaymentStatus.PAID);
        invoice.setPaymentMethod(paymentMethod);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // 2. Chuyển phòng từ CHECKOUT_PENDING → DIRTY để housekeeping vào dọn
        Room room = invoice.getBooking().getRoom();
        if (room != null && room.getRoomStatus() == RoomStatus.CHECKOUT_PENDING) {
            room.setRoomStatus(RoomStatus.DIRTY);
            roomRepository.save(room);
        }

        return toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByBookingId(Long bookingId) {
        Locale locale = LocaleContextHolder.getLocale();
        // Tìm booking trước, sau đó lấy invoice từ booking
        return bookingRepository.findById(bookingId)
                .map(b -> {
                    if (b.getInvoice() == null) {
                        throw new ResourceNotFoundException(
                                messageSource.getMessage("error.invoice.notfound", null, locale));
                    }
                    return toResponse(b.getInvoice());
                })
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.booking.notfound", null, locale)));
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long invoiceId) {
        Locale locale = LocaleContextHolder.getLocale();
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.invoice.notfound", null, locale)));
        return toResponse(invoice);
    }

    // ─── Mapper ───────────────────────────────────────────────────
    private InvoiceResponse toResponse(Invoice invoice) {
        InvoiceResponse res = new InvoiceResponse();
        res.setId(invoice.getId());
        res.setBookingId(invoice.getBooking().getId());
        res.setAmount(invoice.getAmount());
        res.setPaymentStatus(invoice.getPaymentStatus());
        res.setPaymentMethod(invoice.getPaymentMethod());
        res.setPaidAt(invoice.getPaidAt());
        return res;
    }
}

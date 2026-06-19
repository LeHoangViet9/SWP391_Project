package com.hms.service.booking.impl;

import com.hms.common.enums.*;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.Invoice;
import com.hms.entity.hotel.Room;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.service.booking.InvoiceService;
import com.hms.service.booking.mapper.InvoiceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceMapper invoiceMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;
    private final RoomRepository roomRepository;

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        if(invoiceRepository.existsByBookingId(request.getBookingId())) {
            throw new ConflictException(messageSource.getMessage("error.bookingId.exist",
                    new Object[]{request.getBookingId()}, locale));
        }

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("error.bookingId.notfound"));

        // Tính số đêm dựa trên ngày Check-in và Check-out
        long numberOfNights = ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        );
        if(numberOfNights <= 0){
            numberOfNights = 1;
        }

        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight.multiply(BigDecimal.valueOf(numberOfNights));
        BigDecimal additionalCharges = request.getAdditionalChages() != null ? request.getAdditionalChages() : BigDecimal.ZERO;
        BigDecimal total = roomPriceSubTotal.add(additionalCharges);

        Invoice invoice = invoiceMapper.toEntity(request);
        invoice.setBooking(booking);
        invoice.setAmount(total);

        invoice.setPaymentStatus(PaymentStatus.PENDING);
        invoice.setPaymentMethod(request.getPaymentMethod());

        invoiceRepository.save(invoice);

        return buildInvoiceResponse(invoice, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges);
    }

    private InvoiceResponse buildInvoiceResponse(Invoice invoice, long numberOfNights, BigDecimal roomPricePerNight, BigDecimal roomPriceSubTotal, BigDecimal additionalCharges) {
        InvoiceResponse response = invoiceMapper.toResponse(invoice);

        response.setNumberOfNights(numberOfNights);
        response.setRoomPricePerNight(roomPricePerNight);
        response.setRoomPriceSubTotal(roomPriceSubTotal);
        response.setServiceSubTotal(BigDecimal.ZERO);
        response.setAdditionalCharges(additionalCharges);

        return response;
    }

    @Override
    public InvoiceResponse getInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("invoice.notfound"));

        Booking booking = invoice.getBooking();
        long numberOfNights = ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        );
        if(numberOfNights <= 0){
            numberOfNights = 1;
        }

        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight.multiply(BigDecimal.valueOf(numberOfNights));
        BigDecimal additionalCharges = invoice.getAmount().subtract(roomPriceSubTotal);

        return buildInvoiceResponse(invoice, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges);
    }

    @Override
    @Transactional
    public InvoiceResponse updateInvoice(Long id, InvoiceRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("invoice.notfound"));

        // Chỉ cho phép sửa nếu hóa đơn chưa thanh toán thành công (khác PAID)
        if(invoice.getPaymentStatus() == PaymentStatus.PAID){
            throw new ConflictException(messageSource.getMessage("error.payment.paid",
                    new Object[]{invoice.getPaymentStatus()}, LocaleContextHolder.getLocale()));
        }

        Booking booking = invoice.getBooking();
        long numberOfNights = ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        );
        if(numberOfNights <= 0){
            numberOfNights = 1;
        }

        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight.multiply(BigDecimal.valueOf(numberOfNights));
        BigDecimal additionalCharges = request.getAdditionalChages() != null ? request.getAdditionalChages() : BigDecimal.ZERO;
        BigDecimal total = roomPriceSubTotal.add(additionalCharges);

        // Cập nhật thông tin hóa đơn
        invoice.setAmount(total);
        invoice.setNote(request.getNote());
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setUpdatedAt(LocalDateTime.now());
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setPaymentStatus(PaymentStatus.PENDING);

        invoiceRepository.save(invoice);
        return buildInvoiceResponse(invoice, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges);
    }

    @Override
    @Transactional
    public InvoiceResponse processPayment(Long id, String paymentMethod) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("invoice.notfound"));

        if(invoice.getPaymentStatus() == PaymentStatus.PAID){
            throw new ConflictException(messageSource.getMessage("error.payment.paid",
                    new Object[]{invoice.getPaymentStatus()}, LocaleContextHolder.getLocale()));
        }

        PaymentMethod method;
        try {
            method = PaymentMethod.valueOf(paymentMethod.toUpperCase());
        } catch (Exception e){
            throw new IllegalArgumentException("error.payment.method.valid");
        }

        invoice.setPaymentStatus(PaymentStatus.PAID);
        invoice.setPaymentMethod(method);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        Booking booking = invoice.getBooking();
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        long numberOfNights = ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        );
        if(numberOfNights <= 0){
            numberOfNights = 1;
        }

        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight.multiply(BigDecimal.valueOf(numberOfNights));
        BigDecimal additionalCharges = invoice.getAmount().subtract(roomPriceSubTotal);

        return buildInvoiceResponse(invoice, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> searchInvoices(
            String keyword,
            PaymentStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Integer page,
            Integer size,
            String sortBy,
            SortDirection direction) {

        // 1. Xác định trường cần sắp xếp (Mặc định là 'createdAt' nếu truyền vào rỗng)
        String sortField = (sortBy != null && !sortBy.isEmpty()) ? sortBy : "createdAt";
        Pageable pageable = pageableUtils.createPageable(page, size, sortField, direction);

        // [QUAN TRỌNG] 2. Chuẩn hóa keyword trước khi truyền xuống Repository
        // Nếu keyword có chữ, bọc nó bằng %keyword% và ép về chữ thường. Nếu trống, đưa về null hẳn.
        String processedKeyword = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            processedKeyword = "%" + keyword.trim().toLowerCase() + "%";
        }

        // 3. Truy vấn dữ liệu phân trang từ Repository với processedKeyword
        Page<Invoice> invoicePage = invoiceRepository.findInvoicesAdvanced(
                processedKeyword,
                status,
                fromDate,
                toDate,
                pageable
        );

        // 4. Map từ Page<Invoice> sang Page<InvoiceResponse> thông qua DTO builder
        return invoicePage.map(invoice -> {
            Booking booking = invoice.getBooking();

            // Tính số đêm giống như các hàm trên của bạn
            long numberOfNights = ChronoUnit.DAYS.between(
                    booking.getCheckInDate().toLocalDate(),
                    booking.getCheckOutDate().toLocalDate()
            );
            if (numberOfNights <= 0) {
                numberOfNights = 1;
            }

            BigDecimal roomPricePerNight = booking.getPricePerNight();
            BigDecimal roomPriceSubTotal = roomPricePerNight.multiply(BigDecimal.valueOf(numberOfNights));

            // Phí phát sinh = Tổng hóa đơn - Tiền phòng tạm tính
            BigDecimal additionalCharges = invoice.getAmount().subtract(roomPriceSubTotal);

            // Gọi hàm buildResponse phụ trợ đã có sẵn trong class của bạn
            return buildInvoiceResponse(invoice, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges);
        });
    }


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

        return invoiceMapper.toResponse(invoice);
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
                    return invoiceMapper.toResponse(b.getInvoice());
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
        return invoiceMapper.toResponse(invoice);
    }


}

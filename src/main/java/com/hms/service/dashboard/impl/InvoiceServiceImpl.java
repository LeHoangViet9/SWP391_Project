package com.hms.service.dashboard.impl;

import com.hms.common.enums.*;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.Invoice;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.service.dashboard.InvoiceService;
import com.hms.service.dashboard.mapper.InvoiceMapper;
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
    private final RoomRepository roomRepository;
    private final InvoiceMapper invoiceMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

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

        // Xử lý trạng thái dựa trên phương thức thanh toán truyền vào
        if (request.getPaymentMethod() != null) {
            invoice.setPaymentStatus(PaymentStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());

            booking.setBookingStatus(BookingStatus.CHECKED_OUT);
            bookingRepository.save(booking);

            var room = booking.getRoom();
            if (room != null) {
                room.setRoomStatus(RoomStatus.DIRTY);
                roomRepository.save(room);
            }
        } else {
            // Chuyển sang PENDING khi chưa thực hiện thanh toán trực tiếp
            invoice.setPaymentStatus(PaymentStatus.PENDING);
        }

        invoiceRepository.save(invoice);

        return buildInvoiceResponse(invoice, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges);
    }

    private InvoiceResponse buildInvoiceResponse(Invoice invoice, long numberOfNights, BigDecimal roomPricePerNight, BigDecimal roomPriceSubTotal, BigDecimal additionalCharges) {
        InvoiceResponse response = invoiceMapper.toDetailResponse(invoice);

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
        invoice.setCreatedAt(LocalDateTime.now());
        // Logic cập nhật trạng thái hóa đơn chuẩn chỉnh
        if (request.getPaymentMethod() != null) {
            invoice.setPaymentStatus(PaymentStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());

            booking.setBookingStatus(BookingStatus.CHECKED_OUT);
            bookingRepository.save(booking);

            var room = booking.getRoom();
            if (room != null) {
                room.setRoomStatus(RoomStatus.DIRTY);
                roomRepository.save(room);
            }
        } else {
            invoice.setPaymentStatus(PaymentStatus.PENDING);
        }

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
        booking.setBookingStatus(BookingStatus.CHECKED_OUT);
        bookingRepository.save(booking);

        var room = booking.getRoom();
        if (room != null) {
            room.setRoomStatus(RoomStatus.DIRTY);
            roomRepository.save(room);
        }

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


}

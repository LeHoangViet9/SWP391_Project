package com.hms.service.booking.impl;

import com.hms.common.enums.*;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import com.hms.dto.invoice.response.CombinedInvoiceResponse;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.Invoice;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import com.hms.service.booking.InvoiceService;
import com.hms.service.booking.mapper.InvoiceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;
    private final InvoiceMapper invoiceMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Value("${app.finance.vat-rate:0.08}")
    private BigDecimal vatRate;

    @Value("${app.vietqr.bank-id}")
    private String bankId;

    @Value("${app.vietqr.account-no}")
    private String bankAccountNo;

    @Value("${app.vietqr.account-name}")
    private String bankAccountName;

    @Value("${app.vietqr.api-url}")
    private String vietQrApiUrl;

    private static final String MSG_BOOKING_EXIST = "error.bookingId.exist";
    private static final String MSG_BOOKING_NOT_FOUND = "error.bookingId.notfound";
    private static final String MSG_INVOICE_NOT_FOUND = "error.invoice.notfound";

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        if (invoiceRepository.existsByBookingId(request.getBookingId())) {
            throw new ConflictException(messageSource.getMessage(MSG_BOOKING_EXIST,
                    new Object[]{request.getBookingId()}, locale));
        }

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(MSG_BOOKING_NOT_FOUND, null, locale)));

        long numberOfNights = ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        );
        if (numberOfNights <= 0) {
            numberOfNights = 1;
        }

        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight
                .multiply(BigDecimal.valueOf(numberOfNights))
                .multiply(BigDecimal.valueOf(booking.getQuantity()));

        BigDecimal additionalCharges = request.getAdditionalChages() != null ? request.getAdditionalChages() : BigDecimal.ZERO;

        BigDecimal subTotalBeforeTax = roomPriceSubTotal.add(additionalCharges);
        BigDecimal vatAmount = subTotalBeforeTax.multiply(vatRate).setScale(0, RoundingMode.HALF_UP);

        BigDecimal total = subTotalBeforeTax.add(vatAmount);

        Invoice invoice = invoiceMapper.toEntity(request);
        invoice.setBooking(booking);
        invoice.setAmount(total);
        invoice.setPaymentStatus(PaymentStatus.PENDING);
        invoice.setPaymentMethod(request.getPaymentMethod());
        invoice.setCreatedAt(LocalDateTime.now());

        invoiceRepository.save(invoice);

        return buildInvoiceResponse(invoice, booking, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges, vatAmount, total);
    }

    @Override
    @Transactional
    public InvoiceResponse confirmPaymentSuccess(Long bookingId) {
        Locale locale = LocaleContextHolder.getLocale();

        Booking booking = bookingRepository.findByIdWithPessimisticWrite(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(MSG_BOOKING_NOT_FOUND, null, locale)));

        Invoice invoice = booking.getInvoice();
        if (invoice == null) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage(MSG_INVOICE_NOT_FOUND, null, locale));
        }

        // [XÓA PENDING_CHECK_IN] Nếu đã quét xong 100% từ trước và đơn đã là CONFIRMED thì chỉ trả về kết quả
        if (invoice.getPaymentStatus() == PaymentStatus.PAID
                && booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            return calculateAndBuildResponse(invoice, booking);
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED
                || booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT
                || booking.getHoldExpiresAt() == null
                || !booking.getHoldExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ConflictException("Giỏ hàng đã hết hạn hoặc đơn đặt phòng đã bị hủy.");
        }

        // Đánh dấu hoá đơn đã trả tiền hoàn tất 100%
        invoice.setPaymentStatus(PaymentStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        // [XÓA PENDING_CHECK_IN] Chuyển trạng thái booking sang CONFIRMED (Đã thanh toán thành công, chờ ngày khách đến quầy)
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        booking.setHoldExpiresAt(null);
        bookingRepository.save(booking);

        return calculateAndBuildResponse(invoice, booking);
    }

    @Override
    @Transactional(readOnly = true)
    public CombinedInvoiceResponse getCombinedInvoice(List<Long> bookingIds) {
        List<Long> normalizedIds = normalizeBookingIds(bookingIds);
        List<Booking> bookings = normalizedIds.stream()
                .map(id -> bookingRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng #" + id)))
                .toList();
        validateCombinedBookings(bookings);
        return buildCombinedInvoiceResponse(bookings);
    }

    @Override
    @Transactional
    public CombinedInvoiceResponse confirmCombinedPaymentSuccess(List<Long> bookingIds) {
        List<Long> normalizedIds = normalizeBookingIds(bookingIds);
        List<Booking> bookings = normalizedIds.stream()
                .map(id -> bookingRepository.findByIdWithPessimisticWrite(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng #" + id)))
                .toList();
        validateCombinedBookings(bookings);

        // [SỬA TẠI ĐÂY] Nếu toàn bộ danh sách đã PAID và trạng thái đã chuyển sang CONFIRMED từ trước thì trả về kết quả luôn
        boolean allPaid = bookings.stream().allMatch(booking ->
                booking.getInvoice().getPaymentStatus() == PaymentStatus.PAID
                        && booking.getBookingStatus() == BookingStatus.CONFIRMED);
        if (allPaid) return buildCombinedInvoiceResponse(bookings);

        LocalDateTime now = LocalDateTime.now();
        boolean invalid = bookings.stream().anyMatch(booking ->
                booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT
                        || booking.getHoldExpiresAt() == null
                        || !booking.getHoldExpiresAt().isAfter(now)
                        || booking.getInvoice().getPaymentStatus() != PaymentStatus.PENDING);
        if (invalid) {
            throw new ConflictException("Một hoặc nhiều phòng trong hóa đơn đã hết hạn hoặc không còn chờ thanh toán.");
        }

        bookings.forEach(booking -> {
            Invoice invoice = booking.getInvoice();
            invoice.setPaymentStatus(PaymentStatus.PAID);
            invoice.setPaidAt(now);

            // [SỬA TẠI ĐÂY] Đồng bộ chuyển trạng thái booking sang CONFIRMED thay vì PENDING_CHECK_IN cũ
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            booking.setHoldExpiresAt(null);
        });
        invoiceRepository.saveAll(bookings.stream().map(Booking::getInvoice).toList());
        bookingRepository.saveAll(bookings);
        return buildCombinedInvoiceResponse(bookings);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByBookingId(Long bookingId) {
        Locale locale = LocaleContextHolder.getLocale();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(MSG_BOOKING_NOT_FOUND, null, locale)));

        Invoice invoice = booking.getInvoice();
        if (invoice == null) {
            throw new ResourceNotFoundException(
                    messageSource.getMessage(MSG_INVOICE_NOT_FOUND, null, locale));
        }
        return calculateAndBuildResponse(invoice, booking);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long invoiceId) {
        Locale locale = LocaleContextHolder.getLocale();
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(MSG_INVOICE_NOT_FOUND, null, locale)));
        return calculateAndBuildResponse(invoice, invoice.getBooking());
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

        String sortField = (sortBy != null && !sortBy.isEmpty()) ? sortBy : "createdAt";
        Pageable pageable = pageableUtils.createPageable(page, size, sortField, direction);

        String processedKeyword = null;
        if (keyword != null && !keyword.trim().isEmpty()) {
            processedKeyword = "%" + keyword.trim().toLowerCase() + "%";
        }

        Page<Invoice> invoicePage = invoiceRepository.findInvoicesAdvanced(processedKeyword, status, fromDate, toDate, pageable);
        return invoicePage.map(invoice -> calculateAndBuildResponse(invoice, invoice.getBooking()));
    }

    private List<Long> normalizeBookingIds(List<Long> bookingIds) {
        if (bookingIds == null || bookingIds.isEmpty()) {
            throw new BadRequestException("Hóa đơn tổng phải có ít nhất một đơn đặt phòng.");
        }
        return bookingIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
    }

    private void validateCombinedBookings(List<Booking> bookings) {
        if (bookings.isEmpty()) {
            throw new BadRequestException("Hóa đơn tổng phải có ít nhất một đơn đặt phòng.");
        }
        Long customerId = bookings.get(0).getCustomer().getId();
        boolean invalidCustomer = bookings.stream()
                .anyMatch(booking -> !Objects.equals(customerId, booking.getCustomer().getId()));
        if (invalidCustomer) {
            throw new BadRequestException("Các đơn trong hóa đơn tổng phải thuộc cùng một khách hàng.");
        }
        if (bookings.stream().anyMatch(booking -> booking.getInvoice() == null)) {
            throw new ResourceNotFoundException("Một hoặc nhiều đơn đặt phòng chưa có hóa đơn.");
        }
    }

    private CombinedInvoiceResponse buildCombinedInvoiceResponse(List<Booking> bookings) {
        List<InvoiceResponse> items = bookings.stream()
                .map(booking -> calculateAndBuildResponse(booking.getInvoice(), booking))
                .toList();
        BigDecimal totalAmount = items.stream()
                .map(InvoiceResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<Long> bookingIds = bookings.stream().map(Booking::getId).sorted().toList();
        String hash = Integer.toUnsignedString(bookingIds.toString().hashCode());
        String paymentContent = "HMSB" + hash;
        boolean allPaid = bookings.stream()
                .allMatch(booking -> booking.getInvoice().getPaymentStatus() == PaymentStatus.PAID);

        CombinedInvoiceResponse response = CombinedInvoiceResponse.builder()
                .invoiceCode("INV-GROUP-" + hash)
                .bookingIds(bookingIds)
                .items(items)
                .customerName(bookings.get(0).getCustomer().getFullName())
                .totalAmount(totalAmount)
                .paymentStatus(allPaid ? PaymentStatus.PAID : PaymentStatus.PENDING)
                .createdAt(bookings.stream().map(Booking::getCreatedAt).filter(Objects::nonNull).min(LocalDateTime::compareTo).orElse(null))
                .holdExpiresAt(bookings.stream().map(Booking::getHoldExpiresAt).filter(Objects::nonNull).min(LocalDateTime::compareTo).orElse(null))
                .build();

        if (!allPaid) {
            response.setPaymentContent(paymentContent);
            response.setQrCodeUrl(buildQrUrl(totalAmount, paymentContent));
        }
        return response;
    }

    private String buildQrUrl(BigDecimal amount, String paymentContent) {
        try {
            String encodedAccountName = URLEncoder.encode(bankAccountName, StandardCharsets.UTF_8);
            String encodedContent = URLEncoder.encode(paymentContent, StandardCharsets.UTF_8);
            return String.format(vietQrApiUrl, bankId, bankAccountNo,
                    amount.toBigInteger().toString(), encodedContent, encodedAccountName);
        } catch (Exception e) {
            log.error("Không thể tạo VietQR cho nội dung {}", paymentContent, e);
            return null;
        }
    }

    /**
     * Tái tính toán dòng tiền khi truy vấn dữ liệu cũ để tránh lỗi không đồng bộ cấu hình VAT
     */

    private InvoiceResponse calculateAndBuildResponse(Invoice invoice, Booking booking) {
        long numberOfNights = Math.max(1, ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        ));
        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight
                .multiply(BigDecimal.valueOf(numberOfNights))
                .multiply(BigDecimal.valueOf(booking.getQuantity()));

        BigDecimal additionalCharges = BigDecimal.ZERO;

        BigDecimal subTotalBeforeTax = roomPriceSubTotal.add(additionalCharges);
        BigDecimal vatAmount = subTotalBeforeTax.multiply(vatRate).setScale(0, RoundingMode.HALF_UP);

        BigDecimal correctTotalAmount = subTotalBeforeTax.add(vatAmount);

        return buildInvoiceResponse(invoice, booking, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges, vatAmount, correctTotalAmount);
    }

    private InvoiceResponse buildInvoiceResponse(Invoice invoice, Booking booking, long numberOfNights, BigDecimal roomPricePerNight,
                                                 BigDecimal roomPriceSubTotal, BigDecimal additionalCharges, BigDecimal vatAmount, BigDecimal calculatedTotal) {
        InvoiceResponse response = invoiceMapper.toResponse(invoice);

        response.setInvoiceId(invoice.getId());
        response.setBookingId(booking.getId());

        response.setCustomerName(booking.getCustomer() != null ? booking.getCustomer().getFullName() : "N/A");
        response.setRoomNumber(booking.getRoom() != null ? booking.getRoom().getRoomNumber() : "N/A");
        response.setRoomTypeName(booking.getRoomType() != null ? booking.getRoomType().getTypeName() : "N/A");
        response.setQuantity(booking.getQuantity());
        response.setCheckInDate(booking.getCheckInDate());
        response.setCheckOutDate(booking.getCheckOutDate());

        response.setNumberOfNights(numberOfNights);
        response.setRoomPricePerNight(roomPricePerNight);
        response.setRoomPriceSubTotal(roomPriceSubTotal);
        response.setServiceSubTotal(BigDecimal.ZERO);
        response.setVatAmount(vatAmount);
        response.setAdditionalCharges(additionalCharges);

        response.setTotalAmount(calculatedTotal);

        if (invoice.getPaymentStatus() == PaymentStatus.PENDING) {
            String paymentContent = "HMS" + booking.getId();

            response.setQrCodeUrl(buildQrUrl(calculatedTotal, paymentContent));
            response.setPaymentContent(paymentContent);
        }

        return response;
    }
}
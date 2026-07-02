package com.hms.service.booking.impl;

import com.hms.common.enums.*;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.request.ReceptionistPaymentRequest;
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

        // 1. Tính số đêm lưu trú
        long numberOfNights = ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        );
        if (numberOfNights <= 0) {
            numberOfNights = 1;
        }

        // 2. Tính toán dòng tiền
        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight
                .multiply(BigDecimal.valueOf(numberOfNights))
                .multiply(BigDecimal.valueOf(booking.getQuantity()));

        // Sửa lỗi chính tả từ request cũ (chages -> charges nếu DTO của bạn sửa đổi, hoặc giữ nguyên theo DTO)
        BigDecimal additionalCharges = request.getAdditionalChages() != null ? request.getAdditionalChages() : BigDecimal.ZERO;

        BigDecimal subTotalBeforeTax = roomPriceSubTotal.add(additionalCharges);
        BigDecimal vatAmount = subTotalBeforeTax.multiply(vatRate).setScale(0, RoundingMode.HALF_UP);

        // Tổng tiền đúng chuẩn khi tạo mới (Đã cộng VAT)
        BigDecimal total = subTotalBeforeTax.add(vatAmount);

        // 3. Khởi tạo & Lưu thực thể Hóa đơn
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

        if (invoice.getPaymentStatus() == PaymentStatus.PAID
                && booking.getBookingStatus() == BookingStatus.PENDING_CHECK_IN) {
            return calculateAndBuildResponse(invoice, booking);
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED
                || booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT
                || booking.getHoldExpiresAt() == null
                || !booking.getHoldExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ConflictException("Giỏ hàng đã hết hạn hoặc đơn đặt phòng đã bị hủy.");
        }

        invoice.setPaymentStatus(PaymentStatus.PAID);
        if (invoice.getPaymentMethod() == null) invoice.setPaymentMethod(PaymentMethod.TRANSFER);
        invoice.setPaymentConfirmed(true);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        booking.setBookingStatus(BookingStatus.PENDING_CHECK_IN);
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

        boolean allPaid = bookings.stream().allMatch(booking ->
                booking.getInvoice().getPaymentStatus() == PaymentStatus.PAID
                        && booking.getBookingStatus() == BookingStatus.PENDING_CHECK_IN);
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
            if (invoice.getPaymentMethod() == null) invoice.setPaymentMethod(PaymentMethod.TRANSFER);
            invoice.setPaymentConfirmed(true);
            invoice.setPaidAt(now);
            booking.setBookingStatus(BookingStatus.PENDING_CHECK_IN);
            booking.setHoldExpiresAt(null);
        });
        invoiceRepository.saveAll(bookings.stream().map(Booking::getInvoice).toList());
        bookingRepository.saveAll(bookings);
        return buildCombinedInvoiceResponse(bookings);
    }

    @Override
    @Transactional
    public CombinedInvoiceResponse processReceptionistPayment(
            List<Long> bookingIds, ReceptionistPaymentRequest request) {
        List<Long> normalizedIds = normalizeBookingIds(bookingIds);
        List<Booking> bookings = normalizedIds.stream()
                .map(id -> bookingRepository.findByIdWithPessimisticWrite(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt phòng #" + id)))
                .toList();
        validateCombinedBookings(bookings);

        PaymentMethod method = request.getPaymentMethod();
        if (method != PaymentMethod.CASH && method != PaymentMethod.TRANSFER && method != PaymentMethod.CARD) {
            throw new BadRequestException("Lễ tân chỉ có thể chọn tiền mặt, chuyển khoản hoặc thẻ.");
        }

        boolean allPaid = bookings.stream().allMatch(booking ->
                booking.getInvoice().getPaymentStatus() == PaymentStatus.PAID
                        && booking.getBookingStatus() == BookingStatus.PENDING_CHECK_IN);
        if (allPaid) return buildCombinedInvoiceResponse(bookings);

        LocalDateTime now = LocalDateTime.now();
        boolean invalid = bookings.stream().anyMatch(booking ->
                booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT
                        || booking.getInvoice().getPaymentStatus() != PaymentStatus.PENDING);
        if (invalid) {
            throw new ConflictException("Một hoặc nhiều đơn không còn chờ thanh toán.");
        }

        BigDecimal total = bookings.stream()
                .map(booking -> booking.getInvoice().getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cashReceived = null;
        BigDecimal changeAmount = null;
        if (method == PaymentMethod.CASH) {
            cashReceived = request.getCashReceived();
            if (cashReceived == null) {
                throw new BadRequestException("Vui lòng nhập số tiền nhận từ khách.");
            }
            if (cashReceived.compareTo(total) < 0) {
                throw new BadRequestException("Số tiền nhận từ khách phải lớn hơn hoặc bằng tổng tiền hóa đơn.");
            }
            changeAmount = cashReceived.subtract(total);
        } else if (!Boolean.TRUE.equals(request.getPaymentConfirmed())) {
            throw new BadRequestException(method == PaymentMethod.CARD
                    ? "Vui lòng xác nhận đã nhận tiền thanh toán thẻ từ khách."
                    : "Vui lòng xác nhận đã nhận được tiền chuyển khoản.");
        }

        for (int index = 0; index < bookings.size(); index++) {
            Booking booking = bookings.get(index);
            Invoice invoice = booking.getInvoice();
            invoice.setPaymentStatus(PaymentStatus.PAID);
            invoice.setPaymentMethod(method);
            invoice.setPaymentConfirmed(true);
            invoice.setPaidAt(now);
            // Hóa đơn đầu tiên giữ số liệu của giao dịch tổng để không bị cộng trùng.
            invoice.setCashReceived(index == 0 ? cashReceived : null);
            invoice.setChangeAmount(index == 0 ? changeAmount : null);
            booking.setBookingStatus(BookingStatus.PENDING_CHECK_IN);
            booking.setHoldExpiresAt(null);
        }
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
        PaymentMethod paymentMethod = allPaid ? bookings.get(0).getInvoice().getPaymentMethod() : null;
        BigDecimal cashReceived = bookings.stream().map(Booking::getInvoice)
                .map(Invoice::getCashReceived).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal changeAmount = bookings.stream().map(Booking::getInvoice)
                .map(Invoice::getChangeAmount).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        CombinedInvoiceResponse response = CombinedInvoiceResponse.builder()
                .invoiceCode("INV-GROUP-" + hash)
                .bookingIds(bookingIds)
                .items(items)
                .customerName(bookings.get(0).getCustomer().getFullName())
                .totalAmount(totalAmount)
                .paymentStatus(allPaid ? PaymentStatus.PAID : PaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .cashReceived(cashReceived.signum() == 0 ? null : cashReceived)
                .changeAmount(changeAmount)
                .paymentConfirmed(allPaid)
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

        // Tạm thời gán bằng ZERO vì bạn không dùng trường này trong Entity Invoice nữa
        BigDecimal additionalCharges = BigDecimal.ZERO;

        // Tổng tiền trước thuế = Tiền phòng + Phụ phí
        BigDecimal subTotalBeforeTax = roomPriceSubTotal.add(additionalCharges);
        BigDecimal vatAmount = subTotalBeforeTax.multiply(vatRate).setScale(0, RoundingMode.HALF_UP);

        BigDecimal correctTotalAmount = subTotalBeforeTax.add(vatAmount);

        // Đảm bảo truyền đúng tham số khớp hoàn toàn với hàm buildInvoiceResponse phía dưới
        return buildInvoiceResponse(invoice, booking, numberOfNights, roomPricePerNight, roomPriceSubTotal, additionalCharges, vatAmount, correctTotalAmount);
    }

    /**
     * Map DTO và tạo chuỗi kết nối VietQR đồng bộ theo biến calculatedTotal
     */
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
        response.setServiceSubTotal(BigDecimal.ZERO); // Không dùng bảng dịch vụ nữa, đặt bằng 0
        response.setVatAmount(vatAmount);
        response.setAdditionalCharges(additionalCharges);

        // Đồng bộ hiển thị tổng tiền chuẩn
        response.setTotalAmount(calculatedTotal);

        if (invoice.getPaymentStatus() == PaymentStatus.PENDING) {
            String paymentContent = "HMS" + booking.getId();

            response.setQrCodeUrl(buildQrUrl(calculatedTotal, paymentContent));
            response.setPaymentContent(paymentContent);
        }

        return response;
    }
}

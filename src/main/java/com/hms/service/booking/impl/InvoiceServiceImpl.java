package com.hms.service.booking.impl;

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
        BigDecimal roomPriceSubTotal = roomPricePerNight.multiply(BigDecimal.valueOf(numberOfNights));

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
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        booking.setBookingStatus(BookingStatus.PENDING_CHECK_IN);
        booking.setHoldExpiresAt(null);
        bookingRepository.save(booking);

        return calculateAndBuildResponse(invoice, booking);
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

    /**
     * Tái tính toán dòng tiền khi truy vấn dữ liệu cũ để tránh lỗi không đồng bộ cấu hình VAT
     */
    private InvoiceResponse calculateAndBuildResponse(Invoice invoice, Booking booking) {
        long numberOfNights = Math.max(1, ChronoUnit.DAYS.between(
                booking.getCheckInDate().toLocalDate(),
                booking.getCheckOutDate().toLocalDate()
        ));
        BigDecimal roomPricePerNight = booking.getPricePerNight();
        BigDecimal roomPriceSubTotal = roomPricePerNight.multiply(BigDecimal.valueOf(numberOfNights));

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

            try {
                String encodedAccountName = URLEncoder.encode(bankAccountName, StandardCharsets.UTF_8);
                String encodedContent = URLEncoder.encode(paymentContent, StandardCharsets.UTF_8);
                String amountStr = calculatedTotal.toBigInteger().toString();

                String qrUrl = String.format(vietQrApiUrl,
                        bankId, bankAccountNo, amountStr, encodedContent, encodedAccountName);

                response.setQrCodeUrl(qrUrl);
                response.setPaymentContent(paymentContent);
            } catch (Exception e) {
                log.error("Lỗi khi encode dữ liệu link VietQR cho Booking ID: {}", booking.getId(), e);
                response.setQrCodeUrl(null);
            }
        }

        return response;
    }
}

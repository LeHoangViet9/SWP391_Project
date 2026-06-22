package com.hms.scheduler;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.PaymentStatus;
import com.hms.entity.booking.Booking;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingCleanupScheduler {

    private final BookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * Tự động quét mỗi phút để hủy các booking PENDING không thanh toán sau 30 phút.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void cleanupExpiredBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        List<Booking> expiredBookings = bookingRepository.findByBookingStatusAndCreatedAtBefore(
                BookingStatus.PENDING, cutoff);

        if (!expiredBookings.isEmpty()) {
            log.info("Quét thấy {} đơn đặt phòng PENDING quá hạn 30 phút. Tiến hành tự động hủy.", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                booking.setBookingStatus(BookingStatus.CANCELLED);
                
                // Đồng thời hủy hóa đơn nếu có
                if (booking.getInvoice() != null) {
                    booking.getInvoice().setPaymentStatus(PaymentStatus.CANCELLED);
                    invoiceRepository.save(booking.getInvoice());
                }
                
                bookingRepository.save(booking);
                log.info("Tự động hủy đơn đặt phòng ID: {}", booking.getId());
            }
        }
    }
}

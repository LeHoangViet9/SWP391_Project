package com.hms.repository.booking;

import com.hms.entity.booking.PayOSPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PayOSPaymentRepository extends JpaRepository<PayOSPayment, Long> {
    Optional<PayOSPayment> findTopByBookingIdsOrderByCreatedAtDesc(String bookingIds);
}

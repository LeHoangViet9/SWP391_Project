package com.hms.repository.booking;

import com.hms.entity.booking.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice,Long> {
    @Query("Select SUM(i.amount) From Invoice i " +
            "Where i.paymentStatus= com.hms.common.enums.PaymentStatus.PAID")
    BigDecimal calculateTotalRevenueAllTime();
    @Query("SELECT SUM(i.amount) FROM Invoice i " +
            "WHERE i.paymentStatus = com.hms.common.enums.PaymentStatus.PAID " +
            "AND i.paidAt BETWEEN :start AND :end")
    BigDecimal calculateRevenueBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
    @Query("Select SUM(i.amount) From Invoice i " +
            "Where i.paymentStatus= com.hms.common.enums.PaymentStatus.PAID " +
            "group by i.paymentMethod")
    List<Object[]> getRevenueGroupedByPaymentMethod();

}

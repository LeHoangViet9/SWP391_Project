package com.hms.repository.booking;

import com.hms.common.enums.PaymentStatus;
import com.hms.entity.booking.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    @Query("Select i.paymentMethod, SUM(i.amount) From Invoice i " +
            "Where i.paymentStatus= com.hms.common.enums.PaymentStatus.PAID " +
            "group by i.paymentMethod")
    List<Object[]> getRevenueGroupedByPaymentMethod();

    boolean existsByBookingId(Long bookingId);


    @Query("SELECT i FROM Invoice i " +
            "LEFT JOIN i.booking b " +
            "LEFT JOIN b.customer c " +
            "WHERE (:keyword IS NULL OR c.fullName ILIKE :keyword OR i.note ILIKE :keyword) " +
            "AND (:status IS NULL OR i.paymentStatus = :status) " +
            "AND (CAST(:fromDate AS localdatetime) IS NULL OR i.createdAt >= :fromDate) " +
            "AND (CAST(:toDate AS localdatetime) IS NULL OR i.createdAt <= :toDate)")
    Page<Invoice> findInvoicesAdvanced(
            String keyword,
            PaymentStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    );



}

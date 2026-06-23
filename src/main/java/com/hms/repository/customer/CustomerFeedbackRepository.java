package com.hms.repository.customer;

import com.hms.entity.customer.CustomerFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Long> {
    
    List<CustomerFeedback> findByCustomerId(Long customerId);

    List<CustomerFeedback> findByBookingId(Long bookingId);

    @Query("""
        SELECT cf FROM CustomerFeedback cf
        WHERE (:rating IS NULL OR cf.rating = :rating)
        AND (
            CAST(:keyword AS string) IS NULL
            OR LOWER(cf.customer.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(cf.comment) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(cf.booking.roomType.typeName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
        )
    """)
    Page<CustomerFeedback> searchFeedback(
            @Param("keyword") String keyword,
            @Param("rating") Integer rating,
            Pageable pageable
    );
}

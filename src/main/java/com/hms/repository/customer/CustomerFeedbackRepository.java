package com.hms.repository.customer;

import com.hms.entity.customer.CustomerFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hms.common.enums.FeedbackStatus;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Long> {
    
    List<CustomerFeedback> findByCustomerId(Long customerId);

    boolean existsByBookingId(Long bookingId);

    /**
     * Batch query: trả về tập booking IDs đã có feedback.
     * Dùng thay cho N lần gọi existsByBookingId khi render page — tránh N+1.
     */
    @Query("SELECT cf.booking.id FROM CustomerFeedback cf WHERE cf.booking.id IN :ids")
    Set<Long> findBookingIdsWithFeedback(@Param("ids") Collection<Long> ids);

    @Query(value = """
        SELECT DISTINCT cf FROM CustomerFeedback cf
        LEFT JOIN FETCH cf.customer c
        LEFT JOIN FETCH cf.booking b
        LEFT JOIN FETCH b.roomType rt
        WHERE (:rating IS NULL OR cf.rating = :rating)
        AND (:status IS NULL OR cf.status = :status)
        AND (:category IS NULL OR LOWER(cf.category) = LOWER(:category))
        AND (
            CAST(:keyword AS string) IS NULL
            OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(cf.comment) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(rt.typeName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
        )
    """, countQuery = """
        SELECT COUNT(cf) FROM CustomerFeedback cf
        LEFT JOIN cf.customer c
        LEFT JOIN cf.booking b
        LEFT JOIN b.roomType rt
        WHERE (:rating IS NULL OR cf.rating = :rating)
        AND (:status IS NULL OR cf.status = :status)
        AND (:category IS NULL OR LOWER(cf.category) = LOWER(:category))
        AND (
            CAST(:keyword AS string) IS NULL
            OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(cf.comment) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
            OR LOWER(rt.typeName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
        )
    """)
    Page<CustomerFeedback> searchFeedback(
            @Param("keyword") String keyword,
            @Param("rating") Integer rating,
            @Param("status") FeedbackStatus status,
            @Param("category") String category,
            Pageable pageable
    );
}

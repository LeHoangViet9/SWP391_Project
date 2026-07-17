package com.hms.repository.customer;

import com.hms.entity.customer.CustomerFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hms.common.enums.FeedbackStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface CustomerFeedbackRepository extends JpaRepository<CustomerFeedback, Long> {

    @EntityGraph(attributePaths = { "customer", "booking", "booking.roomType" })
    List<CustomerFeedback> findByCustomerEmail(String email);

    Optional<CustomerFeedback> findByIdAndCustomerEmail(Long id, String email);

    boolean existsByBookingId(Long bookingId);

    @EntityGraph(attributePaths = { "customer", "booking", "booking.roomType" })
    List<CustomerFeedback> findByStatusOrderByCreatedAtDesc(FeedbackStatus status);

    @EntityGraph(attributePaths = { "customer", "booking", "booking.roomType" })
    List<CustomerFeedback> findTop5ByStatusAndRatingGreaterThanEqualOrderByCreatedAtDesc(FeedbackStatus status, int rating);

    @EntityGraph(attributePaths = { "customer", "booking", "booking.roomType" })
    List<CustomerFeedback> findAllByOrderByCreatedAtDesc();

    @Query("SELECT cf.booking.id FROM CustomerFeedback cf WHERE cf.booking.id IN :ids")
    Set<Long> findBookingIdsWithFeedback(@Param("ids") Collection<Long> ids);

    @Query(value = """
                SELECT DISTINCT cf FROM CustomerFeedback cf
                LEFT JOIN FETCH cf.customer c
                LEFT JOIN FETCH cf.booking b
                LEFT JOIN FETCH b.roomType rt
                WHERE (:status IS NULL OR cf.status = :status)
                AND (:rating IS NULL OR cf.rating = :rating)
                AND (:category IS NULL OR cf.category = :category)
                AND (
                    CAST(:keyword AS string) IS NULL
                    OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR c.phone LIKE CONCAT('%', CAST(:keyword AS string), '%')
                    OR c.idNumberCard LIKE CONCAT('%', CAST(:keyword AS string), '%')
                    OR LOWER(cf.comment) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(rt.typeName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                )
            """, countQuery = """
                SELECT COUNT(cf) FROM CustomerFeedback cf
                LEFT JOIN cf.customer c
                LEFT JOIN cf.booking b
                LEFT JOIN b.roomType rt
                WHERE (:status IS NULL OR cf.status = :status)
                AND (:rating IS NULL OR cf.rating = :rating)
                AND (:category IS NULL OR cf.category = :category)
                AND (
                    CAST(:keyword AS string) IS NULL
                    OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR c.phone LIKE CONCAT('%', CAST(:keyword AS string), '%')
                    OR c.idNumberCard LIKE CONCAT('%', CAST(:keyword AS string), '%')
                    OR LOWER(cf.comment) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(rt.typeName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                )
            """)
    Page<CustomerFeedback> searchFeedback(
            @Param("keyword") String keyword,
            @Param("status") FeedbackStatus status,
            @Param("rating") Integer rating,
            @Param("category") String category,
            Pageable pageable);

    @Query("""
                SELECT cf.rating, COUNT(cf) FROM CustomerFeedback cf
                LEFT JOIN cf.customer c
                LEFT JOIN cf.booking b
                LEFT JOIN b.roomType rt
                WHERE (:status IS NULL OR cf.status = :status)
                AND (:category IS NULL OR cf.category = :category)
                AND (
                    CAST(:keyword AS string) IS NULL
                    OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR c.phone LIKE CONCAT('%', CAST(:keyword AS string), '%')
                    OR c.idNumberCard LIKE CONCAT('%', CAST(:keyword AS string), '%')
                    OR LOWER(cf.comment) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                    OR LOWER(rt.typeName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                )
                GROUP BY cf.rating
            """)
    List<Object[]> getFeedbackStats(
            @Param("keyword") String keyword,
            @Param("status") FeedbackStatus status,
            @Param("category") String category);

    @Query("""
        SELECT AVG(cf.rating), COUNT(cf) FROM CustomerFeedback cf
        WHERE cf.booking.roomType.id = :roomTypeId
    """)
    List<Object[]> getRatingStatsByRoomTypeId(@Param("roomTypeId") Long roomTypeId);
}

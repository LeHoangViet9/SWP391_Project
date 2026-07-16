package com.hms.repository.booking;

import com.hms.entity.booking.CartHoldItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface CartHoldItemRepository extends JpaRepository<CartHoldItem, Long> {

    @Query("""
            SELECT COUNT(item) > 0
            FROM CartHoldItem item
            JOIN item.cartHold hold
            JOIN item.rooms room
            WHERE room.id = :roomId
            AND hold.status = com.hms.common.enums.CartHoldStatus.ACTIVE
            AND hold.expiresAt > CURRENT_TIMESTAMP
            AND (:excludedHoldId IS NULL OR hold.id <> :excludedHoldId)
            AND item.checkInDate < :checkOutDate
            AND item.checkOutDate > :checkInDate
            """)
    boolean existsActiveConflict(
            @Param("roomId") Long roomId,
            @Param("checkInDate") LocalDateTime checkInDate,
            @Param("checkOutDate") LocalDateTime checkOutDate,
            @Param("excludedHoldId") Long excludedHoldId);
}

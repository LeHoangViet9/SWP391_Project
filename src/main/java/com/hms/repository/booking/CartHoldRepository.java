package com.hms.repository.booking;

import com.hms.common.enums.CartHoldStatus;
import com.hms.entity.booking.CartHold;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CartHoldRepository extends JpaRepository<CartHold, Long> {

    Optional<CartHold> findByHoldToken(String holdToken);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM CartHold h LEFT JOIN FETCH h.items WHERE h.holdToken = :holdToken")
    Optional<CartHold> findByHoldTokenWithLock(@Param("holdToken") String holdToken);

    List<CartHold> findByStatusAndExpiresAtBefore(CartHoldStatus status, LocalDateTime expiresAt);
}

package com.hms.repository.housekeeping;

import com.hms.entity.hotel.RoomStateHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomStateHistoryRepository extends JpaRepository<RoomStateHistory, Long> {

    List<RoomStateHistory> findByRoomIdOrderByChangedAtDesc(Long roomId);

    @Query(value = "SELECT h FROM RoomStateHistory h " +
            "LEFT JOIN FETCH h.triggeredByUser " +
            "LEFT JOIN FETCH h.task " +
            "WHERE h.room.id = :roomId",
            countQuery = "SELECT COUNT(h) FROM RoomStateHistory h WHERE h.room.id = :roomId")
    Page<RoomStateHistory> findByRoomIdWithDetails(@Param("roomId") Long roomId, Pageable pageable);
}
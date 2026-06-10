package com.hms.repository.housekeeping;

import com.hms.entity.housekeeping.HousekeepingRoomStateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomStateHistoryRepository extends JpaRepository<HousekeepingRoomStateHistory, Long> {

    List<HousekeepingRoomStateHistory> findByRoomIdOrderByChangedAtDesc(Long roomId);

    @Query("SELECT h FROM HousekeepingRoomStateHistory h " +
            "LEFT JOIN FETCH h.changedBy " +
            "LEFT JOIN FETCH h.task " +
            "WHERE h.room.id = :roomId " +
            "ORDER BY h.changedAt DESC")
    List<HousekeepingRoomStateHistory> findByRoomIdWithDetails(@Param("roomId") Long roomId);
}
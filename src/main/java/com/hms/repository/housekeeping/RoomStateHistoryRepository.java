package com.hms.repository.housekeeping;

import com.hms.entity.housekeeping.RoomStateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomStateHistoryRepository extends JpaRepository<RoomStateHistory, Long> {

    List<RoomStateHistory> findByRoomIdOrderByChangedAtDesc(Long roomId);
}
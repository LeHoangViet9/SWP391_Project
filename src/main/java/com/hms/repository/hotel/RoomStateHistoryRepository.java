package com.hms.repository.hotel;

import com.hms.entity.hotel.RoomStateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomStateHistoryRepository extends JpaRepository<RoomStateHistory, Long> {
}

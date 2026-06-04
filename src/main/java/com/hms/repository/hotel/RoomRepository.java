package com.hms.repository.hotel;

import com.hms.common.enums.RoomStatus;
import com.hms.entity.hotel.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    boolean existsByRoomNumber(String roomNumber);

    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);

    Optional<Room> findByRoomNumber(String roomNumber);

    Page<Room> findByRoomNumberContainingIgnoreCase(String keywords, Pageable pageable);

    Page<Room> findByRoomStatus(RoomStatus roomStatus, Pageable pageable);

    // Lấy tất cả phòng KHÔNG có status chỉ định (dùng cho soft delete)
    Page<Room> findByRoomStatusNot(RoomStatus roomStatus, Pageable pageable);

    Page<Room> findByFloorNumber(Integer floorNumber, Pageable pageable);

    Page<Room> findByRoomTypeId(Long roomTypeId, Pageable pageable);

    // Lấy phòng theo loại, loại trừ INACTIVE (deleted)
    Page<Room> findByRoomTypeIdAndRoomStatusNot(Long roomTypeId, RoomStatus roomStatus, Pageable pageable);

    // Lấy phòng theo tầng, loại trừ INACTIVE (deleted)
    Page<Room> findByFloorNumberAndRoomStatusNot(Integer floorNumber, RoomStatus roomStatus, Pageable pageable);

    @Query("SELECT r.roomStatus, COUNT(r) FROM Room r GROUP BY r.roomStatus")
    List<Object[]> countRoomsGroupedByStatus();
}


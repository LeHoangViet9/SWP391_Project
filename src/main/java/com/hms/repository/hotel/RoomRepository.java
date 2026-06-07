package com.hms.repository.hotel;

import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.entity.hotel.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    List<Room> findByRoomTypeIdAndRoomStatus(Long roomTypeId, RoomStatus roomStatus);

    @Query("SELECT r FROM Room r " +
           "WHERE r.roomType.id = :roomTypeId " +
           "AND r.roomStatus = :roomStatus " +
           "AND NOT EXISTS (" +
           "   SELECT b FROM Booking b WHERE b.room = r " +
           "   AND b.bookingStatus IN :bookingStatuses " +
           "   AND b.checkInDate < :checkOutDate " +
           "   AND b.checkOutDate > :checkInDate" +
           ")")
    List<Room> findAvailableRoomsForDateRange(
            @Param("roomTypeId") Long roomTypeId,
            @Param("roomStatus") RoomStatus roomStatus,
            @Param("checkInDate") LocalDateTime checkInDate,
            @Param("checkOutDate") LocalDateTime checkOutDate,
            @Param("bookingStatuses") List<BookingStatus> bookingStatuses
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdWithPessimisticWrite(@Param("id") Long id);
}

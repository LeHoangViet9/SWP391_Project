package com.hms.repository.hotel;

import com.hms.common.enums.RoomStatus;
import com.hms.entity.hotel.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {



    Page<Room> findByRoomStatus(RoomStatus roomStatus, Pageable pageable);

    // Lấy tất cả phòng KHÔNG có status chỉ định (dùng cho soft delete)


    // Lấy phòng theo loại, loại trừ INACTIVE (deleted)
    Page<Room> findByRoomTypeIdAndRoomStatusNot(Long roomTypeId, RoomStatus roomStatus, Pageable pageable);

    // Lấy phòng theo tầng, loại trừ INACTIVE (deleted)
    Page<Room> findByFloorNumberAndRoomStatusNot(Integer floorNumber, RoomStatus roomStatus, Pageable pageable);

    // Lấy tất cả phòng theo tầng, bao gồm cả các phòng INACTIVE (để sinh số phòng không bị trùng)
    List<Room> findByFloorNumber(Integer floorNumber);


    @Query("SELECT r.roomStatus, COUNT(r) FROM Room r GROUP BY r.roomStatus")
    List<Object[]> countRoomsGroupedByStatus();

    // Đếm số phòng AVAILABLE thuộc một loại phòng – dùng để kiểm tra số lượng booking

    boolean existsByRoomTypeIdAndRoomStatusNot(Long roomTypeId, RoomStatus roomStatus);

    /**
     * Đếm tổng phòng đang hoạt động của một loại phòng.
     * Loại trừ INACTIVE (đã xóa mềm) và OUT_OF_ORDER (hỏng hóc).
     * Dùng để tính công suất thực sự, độc lập với trạng thái phòng tức thời.
     */
    @Query("""
        SELECT COUNT(r)
        FROM Room r
        WHERE r.roomType.id = :roomTypeId
        AND r.roomStatus NOT IN :excludedStatuses
    """)
    long countByRoomTypeIdAndRoomStatusNotIn(
            @Param("roomTypeId") Long roomTypeId,
            @Param("excludedStatuses") Collection<RoomStatus> excludedStatuses
    );

    @Query("""
SELECT r
FROM Room r
LEFT JOIN r.roomType rt
WHERE r.roomStatus <> com.hms.common.enums.RoomStatus.INACTIVE
AND (
    CAST(:keyword AS string) IS NULL
    OR LOWER(r.roomNumber) LIKE LOWER(CAST(:keyword AS string))
    OR LOWER(rt.typeName) LIKE LOWER(CAST(:keyword AS string))
    OR CAST(r.floorNumber AS string) LIKE CAST(:keyword AS string)
    OR LOWER(CAST(r.roomStatus AS string)) LIKE LOWER(CAST(:keyword AS string))
)
""")
    Page<Room> searchRooms(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * Find available rooms of a specific type that have no overlapping confirmed/checked-in bookings.
     * Used during check-in to auto-assign a room.
     */
    @Query("""
        SELECT r FROM Room r
        WHERE r.roomType.id = :roomTypeId
        AND r.roomStatus = com.hms.common.enums.RoomStatus.AVAILABLE
        AND NOT EXISTS (
            SELECT b FROM Booking b
            WHERE b.room.id = r.id
            AND b.bookingStatus IN (com.hms.common.enums.BookingStatus.CONFIRMED, com.hms.common.enums.BookingStatus.CHECKED_IN)
            AND b.checkInDate < :checkOutDate
            AND b.checkOutDate > :checkInDate
        )
    """)
    List<Room> findAvailableRoomsForCheckIn(
            @Param("roomTypeId") Long roomTypeId,
            @Param("checkInDate") LocalDateTime checkInDate,
            @Param("checkOutDate") LocalDateTime checkOutDate
    );

    /**
     * Find a room by ID with a pessimistic write lock to prevent race conditions during check-in.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdWithPessimisticWrite(@Param("id") Long id);
}

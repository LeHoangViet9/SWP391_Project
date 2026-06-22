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

<<<<<<< HEAD
import org.springframework.data.repository.query.Param;
import java.util.Collection;
=======
import java.time.LocalDateTime;
>>>>>>> CheckIn
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    boolean existsByRoomNumber(String roomNumber);

    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);

<<<<<<< HEAD
=======
    Optional<Room> findByRoomNumber(String roomNumber);


>>>>>>> CheckIn
    Page<Room> findByRoomStatus(RoomStatus roomStatus, Pageable pageable);

    // Lấy tất cả phòng KHÔNG có status chỉ định (dùng cho soft delete)
    Page<Room> findByRoomStatusNot(RoomStatus roomStatus, Pageable pageable);


    // Lấy phòng theo loại, loại trừ INACTIVE (deleted)
    Page<Room> findByRoomTypeIdAndRoomStatusNot(Long roomTypeId, RoomStatus roomStatus, Pageable pageable);

    // Lấy phòng theo tầng, loại trừ INACTIVE (deleted)
    Page<Room> findByFloorNumberAndRoomStatusNot(Integer floorNumber, RoomStatus roomStatus, Pageable pageable);

    // Lấy tất cả phòng theo tầng, bao gồm cả các phòng INACTIVE (để sinh số phòng không bị trùng)
    List<Room> findByFloorNumber(Integer floorNumber);


    @Query("SELECT r.roomStatus, COUNT(r) FROM Room r GROUP BY r.roomStatus")
    List<Object[]> countRoomsGroupedByStatus();
<<<<<<< HEAD

    // Đếm số phòng AVAILABLE thuộc một loại phòng – dùng để kiểm tra số lượng booking
    long countByRoomTypeIdAndRoomStatus(Long roomTypeId, RoomStatus roomStatus);

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
}
=======
>>>>>>> CheckIn

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

    @Query("SELECT r FROM Room r " +
           "WHERE r.roomType.id = :roomTypeId " +
           "AND r.roomStatus = com.hms.common.enums.RoomStatus.AVAILABLE " +
           "AND NOT EXISTS (" +
           "    SELECT b FROM Booking b " +
           "    WHERE b.room = r " +
           "    AND b.bookingStatus IN (com.hms.common.enums.BookingStatus.CONFIRMED, com.hms.common.enums.BookingStatus.CHECKED_IN) " +
           "    AND b.checkInDate < :checkOutDate " +
           "    AND b.checkOutDate > :checkInDate" +
           ")")
    List<Room> findAvailableRoomsForCheckIn(
            @Param("roomTypeId") Long roomTypeId,
            @Param("checkInDate") LocalDateTime checkInDate,
            @Param("checkOutDate") LocalDateTime checkOutDate
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdWithPessimisticWrite(@Param("id") Long id);
}

package com.hms.repository.hotel;

import com.hms.common.enums.RoomStatus;
import com.hms.entity.hotel.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    boolean existsByRoomNumber(String roomNumber);

    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);

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

    @Query("""
SELECT r
FROM Room r
LEFT JOIN r.roomType rt
WHERE r.roomStatus <> com.hms.common.enums.RoomStatus.INACTIVE
AND (
    :keyword IS NULL
    OR LOWER(r.roomNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))
    OR LOWER(rt.typeName) LIKE LOWER(CONCAT('%', :keyword, '%'))
    OR CAST(r.floorNumber AS string) LIKE CONCAT('%', :keyword, '%')
    OR LOWER(CAST(r.roomStatus AS string)) LIKE LOWER(CONCAT('%', :keyword, '%'))
)
""")
    Page<Room> searchRooms(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}


package com.hms.repository.equipment;

import com.hms.entity.equipment.RoomEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomEquipmentRepository extends JpaRepository<RoomEquipment, Long> {

    // Lấy danh sách thiết bị trong 1 phòng
    List<RoomEquipment> findByRoomId(Long roomId);

    // Lấy danh sách phòng đang dùng 1 thiết bị
    List<RoomEquipment> findByEquipmentId(Long equipmentId);

    // Tính tổng số lượng thiết bị này đã gán ở tất cả các phòng
    @Query("SELECT COALESCE(SUM(re.quantity), 0) FROM RoomEquipment re WHERE re.equipment.id = :equipmentId")
    Integer sumQuantityByEquipmentId(@Param("equipmentId") Long equipmentId);

    // Tính tổng số lượng thiết bị này đã gán ở tất cả các phòng ngoại trừ phòng đang chỉ định
    @Query("SELECT COALESCE(SUM(re.quantity), 0) FROM RoomEquipment re WHERE re.equipment.id = :equipmentId AND re.room.id <> :roomId")
    Integer sumQuantityByEquipmentIdAndRoomIdNot(@Param("equipmentId") Long equipmentId, @Param("roomId") Long roomId);

    // ==================== DELETE VALIDATION ====================

    // Kiểm tra thiết bị có đang được gán (assign) cho bất kỳ phòng nào hay không.
    // RoomEquipment dùng quan hệ @ManyToOne Equipment nên phải dùng equipment_Id.
    boolean existsByEquipment_Id(Long equipmentId);

    // ===========================================================

    // Kiểm tra phòng này đã có thiết bị này chưa
    Optional<RoomEquipment> findByRoomIdAndEquipmentId(Long roomId, Long equipmentId);

    boolean existsByRoomIdAndEquipmentId(Long roomId, Long equipmentId);

    // Gỡ thiết bị khỏi phòng
    void deleteByRoomIdAndEquipmentId(Long roomId, Long equipmentId);
}
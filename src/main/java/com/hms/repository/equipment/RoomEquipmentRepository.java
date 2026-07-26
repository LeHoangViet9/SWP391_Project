package com.hms.repository.equipment;

import com.hms.entity.equipment.RoomEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomEquipmentRepository extends JpaRepository<RoomEquipment, Long> {

    // Get list of equipment trong 1 phòng
    List<RoomEquipment> findByRoomId(Long roomId);

    // Get list of room đang dùng 1 thiết bị
    List<RoomEquipment> findByEquipmentId(Long equipmentId);

    // ==================== DELETE VALIDATION ====================

    // Kiểm tra equipment có đang được gán (assign) cho bất kỳ room nào hay không.
    // RoomEquipment dùng quan hệ @ManyToOne Equipment nên phải dùng equipment_Id.
    boolean existsByEquipment_Id(Long equipmentId);

    // ===========================================================

    // Kiểm tra room này đã có equipment này chưa
    Optional<RoomEquipment> findByRoomIdAndEquipmentId(Long roomId, Long equipmentId);

    boolean existsByRoomIdAndEquipmentId(Long roomId, Long equipmentId);

    // Gỡ equipment khỏi phòng
    void deleteByRoomIdAndEquipmentId(Long roomId, Long equipmentId);
}
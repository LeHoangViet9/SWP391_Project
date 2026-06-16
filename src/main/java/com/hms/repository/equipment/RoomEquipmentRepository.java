package com.hms.repository.equipment;

import com.hms.entity.equipment.RoomEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomEquipmentRepository extends JpaRepository<RoomEquipment, Long> {

    // Lấy danh sách thiết bị trong 1 phòng
    List<RoomEquipment> findByRoomId(Long roomId);

    // Lấy danh sách phòng đang dùng 1 thiết bị
    List<RoomEquipment> findByEquipmentId(Long equipmentId);

    // Kiểm tra phòng này đã có thiết bị này chưa
    Optional<RoomEquipment> findByRoomIdAndEquipmentId(Long roomId, Long equipmentId);

    boolean existsByRoomIdAndEquipmentId(Long roomId, Long equipmentId);

    // Gỡ thiết bị khỏi phòng
    void deleteByRoomIdAndEquipmentId(Long roomId, Long equipmentId);
}
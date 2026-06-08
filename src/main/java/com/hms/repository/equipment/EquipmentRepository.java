package com.hms.repository.equipment;

import com.hms.common.enums.EquipmentStatus;
import com.hms.entity.equipment.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    // Kiểm tra trùng mã trên toàn bộ bảng equipments
    boolean existsByEquipmentCode(String equipmentCode);

    // Kiểm tra trùng mã khi update, loại trừ chính equipment hiện tại
    boolean existsByEquipmentCodeAndIdNot(String equipmentCode, Long id);

    // Tìm kiếm equipment chưa bị xóa mềm
    Page<Equipment> findByEquipmentNameContainingIgnoreCaseAndStatusNot(
            String keywords,
            EquipmentStatus status,
            Pageable pageable
    );

    List<Equipment> findByStatus(EquipmentStatus status);
}
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

    // GIỮ:
    // Kiểm tra trùng mã trên mọi bản ghi.
    boolean existsByEquipmentCode(String equipmentCode);

    // GIỮ:
    // Kiểm tra trùng mã với thiết bị đang ACTIVE.
    boolean existsByEquipmentCodeAndStatus(
            String equipmentCode,
            EquipmentStatus status
    );

    // GIỮ:
    // Dùng khi update, tránh báo trùng với chính bản ghi hiện tại.
    boolean existsByEquipmentCodeAndIdNotAndStatus(
            String equipmentCode,
            Long id,
            EquipmentStatus status
    );

    // GIỮ:
    // Tìm theo tên và loại bỏ status nào đó, ví dụ INACTIVE.
    Page<Equipment> findByEquipmentNameContainingIgnoreCaseAndStatusNot(
            String keywords,
            EquipmentStatus status,
            Pageable pageable
    );

    // GIỮ:
    // Lấy danh sách theo trạng thái.
    List<Equipment> findByStatus(EquipmentStatus status);
}
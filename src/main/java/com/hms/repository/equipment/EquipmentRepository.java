package com.hms.repository.equipment;

import com.hms.common.enums.EquipmentStatus;
import com.hms.entity.equipment.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    boolean existsByEquipmentCode(String equipmentCode);

    // Thêm các phương thức kiểm tra / tìm theo status
    boolean existsByEquipmentCodeAndStatus(String equipmentCode, EquipmentStatus status);
    boolean existsByEquipmentCodeAndIdNotAndStatus(String equipmentCode, Long id, EquipmentStatus status);

    List<Equipment> findByStatus(EquipmentStatus status);

    Page<Equipment> findByEquipmentNameContainingIgnoreCaseAndStatus(
            String keywords,
            EquipmentStatus status,
            Pageable pageable
    );

    Optional<Equipment> findByIdAndStatus(Long id, EquipmentStatus status);
}
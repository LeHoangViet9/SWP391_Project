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

    boolean existsByEquipmentCode(String equipmentCode);

    boolean existsByEquipmentCodeAndStatus(String equipmentCode, EquipmentStatus status);

    boolean existsByEquipmentCodeAndIdNotAndStatus(
            String equipmentCode,
            Long id,
            EquipmentStatus status
    );

    Page<Equipment> findByEquipmentNameContainingIgnoreCaseAndStatus(
            String keywords,
            EquipmentStatus status,
            Pageable pageable
    );

    Page<Equipment> findByEquipmentNameContainingIgnoreCaseAndStatusNot(
            String keywords,
            EquipmentStatus status,
            Pageable pageable
    );

    List<Equipment> findByStatus(EquipmentStatus status);
}
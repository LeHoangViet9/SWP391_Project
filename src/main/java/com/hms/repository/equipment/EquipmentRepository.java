package com.hms.repository.equipment;


import com.hms.common.enums.EquipmentStatus;
import com.hms.entity.equipment.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    boolean existsByEquipmentCode(String equipmentCode);

    List<Equipment> findByStatus(EquipmentStatus status);
}
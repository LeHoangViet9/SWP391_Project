package com.hms.repository.equipment;

import com.hms.entity.equipment.EquipmentCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentCheckRepository extends JpaRepository<EquipmentCheck, Long> {

    List<EquipmentCheck> findByEquipment_Id(Long equipmentId);
}
package com.hms.repository.equipment;

import com.hms.entity.equipment.EquipmentImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentImageRepository extends JpaRepository<EquipmentImage, Long> {

    List<EquipmentImage> findByEquipment_Id(Long equipmentId);
}
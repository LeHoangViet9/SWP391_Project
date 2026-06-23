package com.hms.repository.equipment;

import com.hms.entity.equipment.EquipmentImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentImageRepository extends JpaRepository<EquipmentImage, Long> {

    // Lấy danh sách ảnh của 1 thiết bị
    List<EquipmentImage> findByEquipment_Id(Long equipmentId);
}
package com.hms.repository.equipment;

import com.hms.common.enums.EquipmentStatus;
import com.hms.entity.equipment.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {


    // GIỮ:
    // Kiểm tra trùng mã với thiết bị đang ACTIVE.
    boolean existsByEquipmentCodeAndStatus(
            String equipmentCode,
            EquipmentStatus status
    );

    boolean existsByEquipmentCodeIgnoreCase(String equipmentCode);

    boolean existsByEquipmentCodeIgnoreCaseAndIdNot(String equipmentCode, Long id);

    // GIỮ:
    // Dùng khi update, tránh báo trùng với chính bản ghi hiện tại.
    boolean existsByEquipmentCodeAndIdNotAndStatus(
            String equipmentCode,
            Long id,
            EquipmentStatus status
    );

    @Query("""
SELECT DISTINCT e
FROM Equipment e
LEFT JOIN e.roomEquipments re
LEFT JOIN re.room r
WHERE (:status IS NULL OR e.status = :status)
AND (
    CAST(:keyword AS string) IS NULL
    OR LOWER(e.equipmentName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
    OR LOWER(e.equipmentCode) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
    OR CAST(e.id AS string) LIKE CONCAT('%', CAST(:keyword AS string), '%')
    OR LOWER(r.roomNumber) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
)
""")
    Page<Equipment> searchEquipment(
            @Param("keyword") String keyword,
            @Param("status") EquipmentStatus status,
            Pageable pageable
    );

}

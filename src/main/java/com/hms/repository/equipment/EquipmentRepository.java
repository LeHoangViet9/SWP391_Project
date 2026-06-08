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

    // Kiểm tra trùng mã trên mọi bản ghi (ACTIVE/INACTIVE)
    boolean existsByEquipmentCode(String equipmentCode);

    // Kiểm tra trùng mã chỉ với bản ACTIVE (thường dùng khi cho phép tái sử dụng mã của INACTIVE)
    boolean existsByEquipmentCodeAndStatus(String equipmentCode, EquipmentStatus status);
    boolean existsByEquipmentCodeAndIdNotAndStatus(String equipmentCode, Long id, EquipmentStatus status);

    // Tìm kiếm trang theo tên thiết bị và status (đang dùng ở service)
    Page<Equipment> findByEquipmentNameContainingIgnoreCaseAndStatusNot(
            String keywords,
            EquipmentStatus status,
            Pageable pageable
    );

    //  liệt kê theo status thì giữ, nếu không dùng có thể xóa
    List<Equipment> findByStatus(EquipmentStatus status);
}
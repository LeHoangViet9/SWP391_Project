package com.hms.repository.maintenance;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.entity.maintenance.RepairRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<RepairRequest, Long> {

    List<RepairRequest> findByStatus(MaintenanceStatus status);

    // ✅ SỬA CHỖ NÀY: Thêm chữ Id vào sau AssignedTo để mapping đúng với kiểu Long
    List<RepairRequest> findByAssignedToId(Long assignedToId);

    List<RepairRequest> findByRoomId(Long roomId);

    List<RepairRequest> findByEquipmentId(Long equipmentId);

    @Query("SELECT r FROM RepairRequest r WHERE " +
            // 1. Tìm theo keyword
            "(:keyword IS NULL OR LOWER(r.repairReason) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            " OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +

            // 2. Ép Hibernate hiểu Enum bằng COALESCE
            "AND (r.status = COALESCE(:status, r.status)) " +

            // 3. Ép Hibernate hiểu Enum bằng COALESCE
            "AND (r.severity = COALESCE(:severity, r.severity)) " +

            // 4. Ép Hibernate hiểu Object ID bằng COALESCE
            "AND (r.room.id = COALESCE(:roomId, r.room.id)) " +

            // ✅ BỔ SUNG: Lọc theo người được giao việc (Hỗ trợ tìm kiếm nâng cao cho FE)
            "AND (:assignedToId IS NULL OR r.assignedTo.id = :assignedToId)")
    Page<RepairRequest> searchAndFilterRequests(
            @Param("keyword") String keyword,
            @Param("status") MaintenanceStatus status,
            @Param("severity") MaintenanceSeverity severity,
            @Param("roomId") Long roomId,
            @Param("assignedToId") Long assignedToId, // Thêm tham số này vào hàm
            Pageable pageable
    );
}
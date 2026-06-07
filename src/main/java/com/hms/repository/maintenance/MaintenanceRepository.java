package com.hms.repository.maintenance;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.entity.maintenance.RepairRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MaintenanceRepository extends JpaRepository<RepairRequest, Long> {

    List<RepairRequest> findByStatus(MaintenanceStatus status);

    List<RepairRequest> findByAssignedToId(Long assignedToId);

    List<RepairRequest> findByRoomId(Long roomId);

    List<RepairRequest> findByEquipmentId(Long equipmentId);

    @Query("""
            SELECT r FROM RepairRequest r
            WHERE (:keyword IS NULL
                   OR LOWER(r.repairReason) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(r.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:status IS NULL OR r.status = :status)
              AND (:severity IS NULL OR r.severity = :severity)
              AND (:roomId IS NULL OR r.room.id = :roomId)
              AND (:assignedToId IS NULL OR r.assignedTo.id = :assignedToId)
            """)
    Page<RepairRequest> searchAndFilterRequests(
            @Param("keyword") String keyword,
            @Param("status") MaintenanceStatus status,
            @Param("severity") MaintenanceSeverity severity,
            @Param("roomId") Long roomId,
            @Param("assignedToId") Long assignedToId,
            Pageable pageable
    );
}
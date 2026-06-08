package com.hms.repository.maintenance;

import com.hms.common.enums.MaintenanceStatus;
import com.hms.entity.maintenance.RepairRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<RepairRequest, Long> {

    // Lọc theo trạng thái
    List<RepairRequest> findByStatus(MaintenanceStatus status);

    // Lọc theo nhân viên được giao
    List<RepairRequest> findByAssignedTo(Long assignedTo);

    // Lọc theo phòng
    List<RepairRequest> findByRoomId(Long roomId);

    // Lọc theo thiết bị
    List<RepairRequest> findByEquipmentId(Long equipmentId);

    // Dashboard: đếm theo trạng thái
    Long countByStatus(MaintenanceStatus status);

    // Dashboard: đếm request theo mức độ nghiêm trọng
    @Query("""
            SELECT r.severity, COUNT(r)
            FROM RepairRequest r
            GROUP BY r.severity
            """)
    List<Object[]> countRequestsBySeverity();

    // ADDED: lọc danh sách maintenance có điều kiện
    @Query("""
            SELECT r
            FROM RepairRequest r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:roomId IS NULL OR r.roomId = :roomId)
              AND (:equipmentId IS NULL OR r.equipmentId = :equipmentId)
              AND (:assignedTo IS NULL OR r.assignedTo = :assignedTo)
            ORDER BY r.createdAt DESC
            """)
    List<RepairRequest> filterRequests(
            MaintenanceStatus status,
            Long roomId,
            Long equipmentId,
            Long assignedTo
    );
}
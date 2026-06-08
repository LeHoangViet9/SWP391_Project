package com.hms.repository.maintenance;

import com.hms.common.enums.MaintenanceStatus;
import com.hms.entity.maintenance.RepairRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<RepairRequest, Long> {

    List<RepairRequest> findByStatus(MaintenanceStatus status);

    List<RepairRequest> findByAssignedTo(Long assignedTo);

    List<RepairRequest> findByRoomId(Long roomId);

    List<RepairRequest> findByEquipmentId(Long equipmentId);

    Long countByStatus(MaintenanceStatus status);

    @Query("""
            SELECT r.severity, COUNT(r)
            FROM RepairRequest r
            GROUP BY r.severity
            """)
    List<Object[]> countRequestsBySeverity();
}
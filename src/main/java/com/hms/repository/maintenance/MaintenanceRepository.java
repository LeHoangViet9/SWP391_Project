package com.hms.repository.maintenance;

import com.hms.common.enums.MaintenanceStatus;
import com.hms.entity.maintenance.RepairRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<RepairRequest, Long> {

    List<RepairRequest> findByStatus(MaintenanceStatus status);

    List<RepairRequest> findByAssignedTo(Long assignedTo);

    List<RepairRequest> findByRoomId(Long roomId);

    List<RepairRequest> findByEquipmentId(Long equipmentId);
    long countByStatus(MaintenanceStatus status);

    default BigDecimal totalMaintenanceCost() {
        return BigDecimal.ZERO;
    }

    @Query("select r.severity, count(r) from RepairRequest r group by r.severity")
    List<Object[]> countRequestsBySeverity();
}

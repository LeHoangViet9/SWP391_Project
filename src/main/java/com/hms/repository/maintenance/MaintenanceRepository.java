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

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<RepairRequest, Long> {




    long countByStatus(MaintenanceStatus status);

    default BigDecimal totalMaintenanceCost() {
        return BigDecimal.ZERO;
    }

    @Query("select r.severity, count(r) from RepairRequest r group by r.severity")
    List<Object[]> countRequestsBySeverity();

    @Query("SELECT r FROM RepairRequest r WHERE " +
            "(:keyword IS NULL " +
            " OR r.issueTitle ILIKE :keyword " +
            " OR CAST(r.id AS string) ILIKE :keyword " +
            " OR CAST(r.roomId AS string) ILIKE :keyword " +
            " OR CAST(r.equipmentId AS string) ILIKE :keyword) " + // Tìm kiếm đa năng bằng keyword
            "AND (:severity IS NULL OR r.severity = :severity) " +
            "AND (:status IS NULL OR r.status = :status)")
    Page<RepairRequest> findRequestsAdvanced(
            @Param("keyword") String keyword,
            @Param("severity") MaintenanceSeverity severity,
            @Param("status") MaintenanceStatus status,
            Pageable pageable
    );
}

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
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<RepairRequest, Long> {

    // ==================== DELETE VALIDATION ====================

    // Kiểm tra thiết bị có đang xuất hiện trong bất kỳ yêu cầu bảo trì nào hay không.
    // Nếu tồn tại thì không cho phép xóa thiết bị.
    boolean existsByEquipmentId(Long equipmentId);

    // Kiểm tra xem nhân viên bảo trì có đang thực hiện yêu cầu sửa chữa nào ở trạng thái nhất định không
    boolean existsByAssignedToAndStatus(Long assignedTo, MaintenanceStatus status);

    // ===========================================================

    long countByStatus(MaintenanceStatus status);

    long countByAssignedTo(Long assignedTo);

    long countByAssignedToAndStatus(Long assignedTo, MaintenanceStatus status);

    default BigDecimal totalMaintenanceCost() {
        return BigDecimal.ZERO;
    }

    @Query("select r.severity, count(r) from RepairRequest r group by r.severity")
    List<Object[]> countRequestsBySeverity();

    @Query("SELECT r.severity, COUNT(r) FROM RepairRequest r WHERE r.assignedTo = :assignedTo GROUP BY r.severity")
    List<Object[]> countRequestsBySeverityAndAssignedTo(@Param("assignedTo") Long assignedTo);

    @Query("SELECT r FROM RepairRequest r WHERE " +
            "(:keyword IS NULL " +
            " OR r.issueTitle ILIKE :keyword " +
            " OR CAST(r.id AS string) ILIKE :keyword " +
            " OR CAST(r.roomId AS string) ILIKE :keyword " +
            " OR CAST(r.equipmentId AS string) ILIKE :keyword) " +
            "AND (:severity IS NULL OR r.severity = :severity) " +
            "AND (:status IS NULL OR r.status = :status) " +
            "AND (:assignedTo IS NULL OR r.assignedTo = :assignedTo)")
    Page<RepairRequest> findRequestsAdvanced(
            @Param("keyword") String keyword,
            @Param("severity") MaintenanceSeverity severity,
            @Param("status") MaintenanceStatus status,
            @Param("assignedTo") Long assignedTo,
            Pageable pageable
        );

    @Query("SELECT r FROM RepairRequest r WHERE r.status NOT IN :statuses AND r.estimatedCompletionTime IS NOT NULL AND r.estimatedCompletionTime <= :now")
    List<RepairRequest> findExpiredActiveRequests(
            @Param("statuses") List<MaintenanceStatus> statuses,
            @Param("now") LocalDateTime now
    );

    /*
     * THÊM MỚI: Tìm tất cả phiếu ASSIGNED mà đã được giao trước thời điểm :threshold (quá 15 phút).
     * Trước đây: Không có query này → không thể phát hiện phiếu bị "treo" bao lâu.
     * Sau khi thêm: Scheduler dùng query này để quét mọi phút và thu hồi việc quá hạn.
     * :threshold = LocalDateTime.now().minusMinutes(15)
     */
    @Query("SELECT r FROM RepairRequest r WHERE r.status = com.hms.common.enums.MaintenanceStatus.ASSIGNED AND r.assignedAt IS NOT NULL AND r.assignedAt <= :threshold")
    List<RepairRequest> findStaleAssignedRequests(@Param("threshold") LocalDateTime threshold);
}
package com.hms.dto.maintenance.response;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResponse {

    private Long id;

    // === Thông tin về Phòng ===
    private Long roomId;
    private String roomNumber;

    // === Thông tin về Thiết bị ===
    private Long equipmentId;
    private String equipmentName;

    // === Thông tin nhân sự ===
    private Long reportedBy;
    private String reportedByName;

    private Long assignedToId;
    private String assignedToName;

    // === Thông tin chi tiết sự cố (Khớp tên với Entity) ===
    private String repairReason;
    private String description;

    private String diagnosis;
    private String repairResult;
    private BigDecimal cost;

    // === Trạng thái và Thời gian ===
    private MaintenanceSeverity severity;
    private MaintenanceStatus status;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
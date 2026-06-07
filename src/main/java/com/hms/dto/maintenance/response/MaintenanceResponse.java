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

    private Long roomId;
    private String roomNumber;

    private Long equipmentId;
    private String equipmentName;

    private Long reportedBy;
    private String reportedByName;

    private Long assignedToId;
    private String assignedToName;

    private String repairReason;
    private String description;

    private String diagnosis;
    private String repairResult;
    private BigDecimal cost;

    private MaintenanceSeverity severity;
    private MaintenanceStatus status;

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


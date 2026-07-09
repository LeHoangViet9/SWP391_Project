package com.hms.dto.maintenance.response;
import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceResponse {

    private Long id;

    private Long roomId;

    private Long equipmentId;

    private Long reportedBy;

    private Long assignedTo;

    private String issueTitle;

    private String issueDescription;

    private String diagnosis;

    private String repairResult;

    private MaintenanceSeverity severity;

    private MaintenanceStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    private LocalDateTime estimatedCompletionTime;
}
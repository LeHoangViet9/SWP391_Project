package com.hms.dto.maintenance.request;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRequestUpdateDTO {

        private Long assignedTo;

        private MaintenanceSeverity severity;

        private MaintenanceStatus status;

        private String diagnosis;

        private String repairResult;

        private java.time.LocalDateTime estimatedCompletionTime;
}

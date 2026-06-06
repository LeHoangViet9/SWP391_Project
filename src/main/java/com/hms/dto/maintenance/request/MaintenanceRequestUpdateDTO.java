package com.hms.dto.maintenance.request;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRequestUpdateDTO {

        private Long assignedToId;

        private MaintenanceSeverity severity;

        private MaintenanceStatus status;

        private String description;

        private String diagnosis;

        private String repairResult;

        private BigDecimal cost;
}

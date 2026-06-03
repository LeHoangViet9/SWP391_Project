package com.hms.dto.maintenance.request;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MaintenanceRequestUpdateDTO {

        private String diagnosis;

        private String repairResult;

        @NotNull(message = "{maintenance.severity.notnull}")
        private MaintenanceSeverity severity;

        @NotNull(message = "{maintenance.status.notnull}")
        private MaintenanceStatus status;

        private Long assignedTo;


}

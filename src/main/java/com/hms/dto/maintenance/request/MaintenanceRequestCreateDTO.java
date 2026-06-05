package com.hms.dto.maintenance.request;

import com.hms.common.enums.MaintenanceSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRequestCreateDTO {

        @NotNull(message = "{maintenance.roomId.notnull}")
        private Long roomId;

        private Long equipmentId;

        @NotNull(message = "{maintenance.reportedBy.notnull}")
        private Long reportedBy;

        @NotBlank(message = "{maintenance.issueTitle.notblank}")
        private String issueTitle;

        private String issueDescription;

        @NotNull(message = "{maintenance.severity.notnull}")
        private MaintenanceSeverity severity;
}
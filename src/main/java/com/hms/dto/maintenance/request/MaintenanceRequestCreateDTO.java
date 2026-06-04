package com.hms.dto.maintenance.request;
import com.hms.common.enums.MaintenanceSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceRequestCreateDTO {

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

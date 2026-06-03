package com.hms.dto.maintenance.request;
import com.hms.common.enums.MaintenanceSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MaintenanceRequestCreateDTO {

        private Long roomId;

        private Long equipmentId;

        private Long assignedTo;

        @NotBlank(message = "{maintenance.issueTitle.notblank}")
        private String issueTitle;

        private String issueDescription;

        @NotNull(message = "{maintenance.severity.notnull}")
        private MaintenanceSeverity severity;

}

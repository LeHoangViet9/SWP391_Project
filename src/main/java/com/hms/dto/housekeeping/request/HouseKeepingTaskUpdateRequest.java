package com.hms.dto.housekeeping.request;

import com.hms.common.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HouseKeepingTaskUpdateRequest {

    private Long roomId;

    private Long assignedToId;

    private TaskStatus taskStatus;

    private String notes;
}


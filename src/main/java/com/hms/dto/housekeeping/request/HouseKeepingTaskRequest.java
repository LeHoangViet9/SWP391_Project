package com.hms.dto.housekeeping.request;

import com.hms.common.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HouseKeepingTaskRequest {

    @NotNull(message = "{task.room.notnull}")
    private Long roomId;

    @NotNull(message = "{task.assignedto.notnull}")
    private Long assignedToId;

    @NotNull(message = "{task.assignedby.notnull}")
    private Long assignedById;

    private String notes;
}


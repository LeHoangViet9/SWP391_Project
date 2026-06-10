package com.hms.dto.housekeeping.request;

import com.hms.common.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HouseKeepingTaskUpdateRequest {

    private TaskStatus taskStatus;

    private String notes;

    private LocalDateTime startedAt;
}



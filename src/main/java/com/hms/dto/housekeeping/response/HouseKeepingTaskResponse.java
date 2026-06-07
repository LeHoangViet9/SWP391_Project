package com.hms.dto.housekeeping.response;

import com.hms.common.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HouseKeepingTaskResponse {

    private Long id;

    private Long roomId;

    private String roomNumber;

    private Long assignedToId;

    private String assignedToName;

    private Long assignedById;

    private String assignedByName;

    private TaskStatus taskStatus;

    private String notes;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;
}


package com.hms.dto.housekeeping.response;

import com.hms.common.enums.RoomStatus;
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

    private RoomStatus roomState;

    private Long assignedToId;

    private String assignedToName;

    private Long assignedById;

    private String assignedByName;

    private TaskStatus taskStatus;

    private String notes;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    // FIX: Trả thêm updatedAt để frontend biết task vừa được cập nhật lúc nào.
    private LocalDateTime updatedAt;
}
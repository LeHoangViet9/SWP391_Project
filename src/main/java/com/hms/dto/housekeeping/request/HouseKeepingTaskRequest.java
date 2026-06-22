package com.hms.dto.housekeeping.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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

    // FIX: Request tạo task có thể truyền thời điểm bắt đầu dọn.
    // Nếu startedAt != null thì task được tạo ở trạng thái IN_PROGRESS.
    private LocalDateTime startedAt;
}
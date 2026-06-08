package com.hms.dto.housekeeping.response;

import com.hms.common.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomStateHistoryResponse {

    private Long id;
    private Long roomId;
    private String roomNumber;
    private RoomStatus previousState;
    private RoomStatus newState;
    private Long changedById;
    private String changedByName;
    private Long taskId;
    private LocalDateTime changedAt;
    private String reason;
}

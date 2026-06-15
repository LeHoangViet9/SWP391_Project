package com.hms.dto.housekeeping.response;

import com.hms.common.enums.ProcessTrigger;
import com.hms.common.enums.RoomStatus;
import com.hms.entity.auth.User;
import com.hms.entity.hotel.Room;
import com.hms.entity.housekeeping.HouseKeepingTask;
import jakarta.persistence.*;
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
    private RoomStatus currentState;
    private ProcessTrigger triggeredByProcess;

    private Long triggeredByUserId;
    private String triggeredByUserName;

    private LocalDateTime changedAt;
    private String reason;

    private Long taskId;
}

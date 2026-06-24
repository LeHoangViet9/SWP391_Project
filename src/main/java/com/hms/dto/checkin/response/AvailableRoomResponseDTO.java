package com.hms.dto.checkin.response;

import com.hms.common.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailableRoomResponseDTO {
    private Long id;
    private String roomNumber;
    private Integer floorNumber;
    private RoomStatus roomStatus;
    private String roomTypeName;
}

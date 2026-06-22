package com.hms.dto.equipment.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomEquipmentResponse {

    private Long id;

    // Thông tin phòng
    private Long roomId;
    private String roomNumber;
    private Long roomTypeId;
    private String roomTypeName;

    // Thông tin thiết bị
    private Long equipmentId;
    private String equipmentName;
    private String equipmentCode;

    // Số lượng thiết bị được gán vào phòng
    private Integer quantity;

    private LocalDateTime assignedAt;
}
package com.hms.dto.equipment.response;

import com.hms.common.enums.EquipmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EquipmentResponse {

    private Long id;
    private String equipmentName;
    private String equipmentCode;

    private String description;
    private Integer totalQuantity;
    private Integer assignedQuantity;
    private Integer availableQuantity;

    private EquipmentStatus status;
    private LocalDateTime createdAt;

    private List<EquipmentImageResponse> images;
    private List<RoomEquipmentResponse> assignedRooms;
}
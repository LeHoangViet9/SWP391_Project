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
    private EquipmentStatus status;
    private LocalDateTime createdAt;

    private List<EquipmentImageResponse> images;
    private List<EquipmentCheckResponse> checks;

    //  MỚI:
    // Equipment không còn thuộc trực tiếp 1 phòng.
    // Trả về danh sách phòng đang dùng thiết bị này.
    private List<RoomEquipmentResponse> assignedRooms;
}
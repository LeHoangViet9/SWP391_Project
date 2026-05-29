package com.hms.dto.equipment.response;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EquipmentResponse {
    private Long id;

    private String equipmentName;

    private String equipmentCode;

    private String location;

    private String description;

    private String imageUrl;

    private String status;

    private LocalDateTime createdAt;
}

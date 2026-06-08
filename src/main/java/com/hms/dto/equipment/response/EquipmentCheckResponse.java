package com.hms.dto.equipment.response;

import lombok.*;
import com.hms.common.enums.EquipmentConditionStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentCheckResponse {

    private Long id;
    private EquipmentConditionStatus conditionStatus;
    private String checkNote;
    private Long checkedById;
    private String checkedByName;
    private LocalDateTime checkedAt;

}
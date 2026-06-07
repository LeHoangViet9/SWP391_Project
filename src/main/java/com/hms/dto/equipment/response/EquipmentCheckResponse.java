package com.hms.dto.equipment.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentCheckResponse {

    private Long id;
    private String conditionStatus;
    private String checkNote;
    private Long checkedById;
    private String checkedByName;
    private LocalDateTime checkedAt;

}
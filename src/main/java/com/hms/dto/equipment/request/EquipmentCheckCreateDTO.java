package com.hms.dto.equipment.request;

import com.hms.common.enums.EquipmentConditionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EquipmentCheckCreateDTO {

    // ADDED: dùng enum để tránh nhập lung tung: GOOD, NEED_REPAIR, DAMAGED, LOST
    @NotNull(message = "Condition status cannot be null")
    private EquipmentConditionStatus conditionStatus;

    private String checkNote;

    private Long checkedById;
}
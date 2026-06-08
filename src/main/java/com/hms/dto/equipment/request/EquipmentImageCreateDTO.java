package com.hms.dto.equipment.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EquipmentImageCreateDTO {

    @NotBlank(message = "Image url cannot be blank")
    private String imageUrl;

    // ADDED: nếu true thì ảnh này là ảnh chính của thiết bị
    private Boolean isPrimary = false;
}
package com.hms.dto.equipment.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class EquipmentCreateDTO {

    @NotBlank(message = "{equipment.name.notblank}")
    private String equipmentName;

    @NotBlank(message = "{equipment.code.notblank}")
    @Pattern(
            regexp = "^[A-Za-z0-9\\-]{2,30}$",
            message = "{equipment.code.valid}"
    )
    private String equipmentCode;

    @NotBlank(message = "{equipment.location.notblank}")
    private String location;

    private String description;

    private String imageUrl;
}


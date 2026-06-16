package com.hms.dto.equipment.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssignEquipmentToRoomDTO {

    //  MỚI: chọn phòng cần gán
    @NotNull(message = "Room is required")
    private Long roomId;

    // MỚI: số lượng thiết bị trong phòng
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
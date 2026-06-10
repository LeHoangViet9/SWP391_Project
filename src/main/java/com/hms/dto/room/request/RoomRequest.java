package com.hms.dto.room.request;

import com.hms.common.enums.RoomStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class RoomRequest {

    @NotBlank(message = "{room.number.notblank}")
    private String roomNumber;

    @NotNull(message = "{room.roomtype.notnull}")
    private Long roomTypeId;

    // Hệ thống tự set status AVAILABLE khi tạo, không cần user nhập
    // private RoomStatus roomStatus;

    @NotNull(message = "{room.floor.notnull}")
    @Min(value = 1, message = "{room.floor.min}")
    private Integer floorNumber;

    private String description;
   private List<String> imageUrls;
}


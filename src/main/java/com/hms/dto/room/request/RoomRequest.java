package com.hms.dto.room.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@Data
public class RoomRequest {


    @NotNull(message = "{room.roomtype.notnull}")
    private Long roomTypeId;

    @NotNull(message = "{room.floor.notnull}")
    @Min(value = 1, message = "{room.floor.min}")
    @Max(value = 100, message = "{room.floor.max}")
    private Integer floorNumber;

    @Size(max = 500, message = "{room.description.size}")
    @Pattern(regexp = "^(?!\\s+$)[\\s\\S]*$", message = "{room.description.notblank}")
    private String description;

    private List<MultipartFile> imageRoom;
}


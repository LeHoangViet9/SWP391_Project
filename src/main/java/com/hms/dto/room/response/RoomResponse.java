package com.hms.dto.room.response;

import com.hms.common.enums.RoomStatus;
import com.hms.dto.roomtype.response.RoomTypeResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomResponse {
    private Long id;
    private String roomNumber;
    private RoomTypeResponse roomType;
    private RoomStatus roomStatus;
    private Integer floorNumber;
    private String description;
    private String imageRoom;
    private List<String> imageRooms;
    private List<String> deletedImageRooms;
}


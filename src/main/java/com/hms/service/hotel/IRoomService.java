package com.hms.service.hotel;

import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import org.springframework.data.domain.Page;

public interface IRoomService {

    Page<RoomResponse> getAllRooms(String keywords, Integer page, Integer size, SortField sortBy, SortDirection direction);

    RoomResponse getRoomById(Long id);

    RoomResponse createRoom(RoomRequest roomRequest);

    RoomResponse updateRoom(Long id, RoomRequest roomRequest);

    void deleteRoomByID(Long id);

    Page<RoomResponse> getRoomsByStatus(RoomStatus roomStatus, Integer page, Integer size);

    Page<RoomResponse> getRoomsByFloor(Integer floorNumber, Integer page, Integer size);

    Page<RoomResponse> getRoomsByRoomType(Long roomTypeId, Integer page, Integer size);

    void updateRoomStatus(Long roomId, RoomStatus status);
}


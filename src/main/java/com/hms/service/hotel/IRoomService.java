package com.hms.service.hotel;

import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IRoomService {

    Page<RoomResponse> getAllRooms(
            String keyword,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction);


    RoomResponse getRoomById(Long id);

    RoomResponse createRoom(RoomRequest roomRequest, List<MultipartFile> file);

    RoomResponse updateRoom(Long id, RoomRequest roomRequest,List<MultipartFile> file);

    void deleteRoomByID(Long id);

    Page<RoomResponse> getRoomsByStatus(RoomStatus roomStatus, Integer page, Integer size);

    Page<RoomResponse> getRoomsByFloor(Integer floorNumber, Integer page, Integer size);

    Page<RoomResponse> getRoomsByRoomType(Long roomTypeId, Integer page, Integer size);

    // Lấy tất cả phòng đang trống/available
    Page<RoomResponse> getAvailableRooms(Integer page, Integer size);

    void updateRoomStatus(Long roomId, RoomStatus status);

}


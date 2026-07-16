package com.hms.service.hotel;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.dto.roomtype.request.RoomTypeRequest;
import org.springframework.data.domain.Page;

public interface IRoomTypeService {

    Page<RoomTypeResponse> getAllRoomType(
            String keyword,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    RoomTypeResponse getRoomTypeById(Long id);

    RoomTypeResponse createRoomType(RoomTypeRequest roomType);

    RoomTypeResponse updateRoomType(Long id,
                                    RoomTypeRequest roomType);
    void deleteRoomTypeByID(Long id);

}

package com.hms.service.hotel;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.dto.roomtype.request.RoomTypeRequest;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IRoomTypeService {

    Page<RoomTypeResponse> getAllRoomType(
            String keyword,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    RoomTypeResponse getRoomTypeById(Long id);

    RoomTypeResponse createRoomType(RoomTypeRequest roomType, List<MultipartFile> images);

    RoomTypeResponse updateRoomType(Long id,
                                    RoomTypeRequest roomType,
                                    List<MultipartFile> images);
    void deleteRoomTypeByID(Long id);

}

package com.hms.service.equipment;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.AssignEquipmentToRoomDTO;
import com.hms.dto.equipment.request.BulkAssignEquipmentDTO;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.dto.equipment.response.RoomEquipmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;



public interface EquipmentService {

    Page<EquipmentResponse> getAllEquipments(
            String keyword,
            EquipmentStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    // GIỮ: tạo equipment vào danh sách Equipment.
    // Không gán room trong hàm này.
    EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO);

    // GIỮ: sửa thông tin thiết bị.
    // Không sửa room trong hàm này.
    EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto);

    // GIỮ: xóa mềm hoặc xóa equipment tùy service impl của bạn.
    void deleteEquipment(Long id);

    // GIỮ: xem chi tiết thiết bị.
    EquipmentResponse findById(Long id);

    //  MỚI:
    // Gán equipment vào room ở màn hình Assign Equipment To Room.
    RoomEquipmentResponse assignToRoom(Long equipmentId, AssignEquipmentToRoomDTO dto);

    //  MỚI:
    // Gỡ equipment khỏi phòng.
    void removeFromRoom(Long equipmentId, Long roomId);

    // SỬA MỚI:
    // Get list of equipment đang có trong một phòng.
    List<RoomEquipmentResponse> getEquipmentsByRoom(Long roomId);

    // NEW: Upload nhiều ảnh local cho 1 thiết bị
    List<EquipmentImageResponse> uploadImages(
            Long equipmentId,
            List<MultipartFile> images
    );

    // THÊM MỚI (Cách 2): Gán hàng loạt equipment vào phòng
    List<RoomEquipmentResponse> assignBulkToRoom(
            Long roomId,
            List<BulkAssignEquipmentDTO> dtos
    );
}
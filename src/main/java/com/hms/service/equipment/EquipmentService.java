package com.hms.service.equipment;

import com.hms.common.enums.EquipmentStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.equipment.request.AssignEquipmentToRoomDTO;
import com.hms.dto.equipment.request.EquipmentCreateDTO;
import com.hms.dto.equipment.response.EquipmentImageResponse;
import com.hms.dto.equipment.response.EquipmentResponse;
import com.hms.dto.equipment.response.RoomEquipmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EquipmentService {

    Page<EquipmentResponse> getAllEquipments(
            Long id,
            String equipmentName,
            String equipmentCode,


            // SỬA: giữ tạm roomId nếu controller/frontend hiện tại vẫn truyền lên để filter.
            // Nhưng về nghiệp vụ mới, Equipment không còn gán trực tiếp với room.
            // Sau này có thể bỏ roomId khỏi getAllEquipments nếu không dùng nữa.
            Long roomId,

            EquipmentStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    // GIỮ: tạo thiết bị vào danh sách Equipment.
    // Không gán phòng trong hàm này.
    EquipmentResponse createEquipment(EquipmentCreateDTO equipmentDTO);

    // GIỮ: sửa thông tin thiết bị.
    // Không sửa phòng trong hàm này.
    EquipmentResponse updateEquipment(Long id, EquipmentCreateDTO dto);

    // GIỮ: xóa mềm hoặc xóa thiết bị tùy service impl của bạn.
    void deleteEquipment(Long id);

    // GIỮ: xem chi tiết thiết bị.
    EquipmentResponse findById(Long id);

    //  MỚI:
    // Gán thiết bị vào phòng ở màn hình Assign Equipment To Room.
    RoomEquipmentResponse assignToRoom(Long equipmentId, AssignEquipmentToRoomDTO dto);

    //  MỚI:
    // Gỡ thiết bị khỏi phòng.
    void removeFromRoom(Long equipmentId, Long roomId);

    // SỬA MỚI:
    // Lấy danh sách thiết bị đang có trong một phòng.
    List<RoomEquipmentResponse> getEquipmentsByRoom(Long roomId);

    // SỬA MỚI:
    // Upload ảnh local cho thiết bị.
    EquipmentImageResponse uploadImage(Long equipmentId, MultipartFile image, Boolean isPrimary);
}
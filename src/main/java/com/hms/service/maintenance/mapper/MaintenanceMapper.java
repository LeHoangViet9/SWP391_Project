package com.hms.service.maintenance.mapper;

import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.util.List;

@Mapper(componentModel = "spring") // Khai báo đây là MapStruct Mapper, tự động đăng ký vào Spring Bean Container
public interface MaintenanceMapper {

        // =====================================================================================
        // HÀM 1: Dùng trong Luồng TẠO MỚI (CHIỀU VÀO)
        // - Đợi gọi tại: MaintenanceServiceImpl.java (Dòng 113)
        // - Nhiệm vụ: Chuyển dữ liệu DTO từ Client gửi lên thành Entity để Hibernate
        // lưu xuống MySQL
        // - MapStruct tự copy các trường trùng tên: roomId, equipmentId, issueTitle,
        // issueDescription, severity...
        // =====================================================================================
        RepairRequest toEntity(MaintenanceRequestCreateDTO dto);

        // =====================================================================================
        // HÀM 2: Dùng trong Luồng TRẢ VỀ RESPONSE (CHIỀU RA)
        // - Đợi gọi tại: MaintenanceServiceImpl.java (Dòng 133 & các hàm getById,
        // acceptRequest...)
        // - Nhiệm vụ: Chuyển thực thể RepairRequest từ Database thành DTO Response
        // chuẩn để gửi về Frontend
        // - MapStruct tự copy các trường trùng tên: id, roomId, equipmentId, status,
        // createdAt...
        // =====================================================================================
        MaintenanceResponse toResponse(RepairRequest repairRequest);

        // =====================================================================================
        // HÀM 3: Dùng trong Luồng CẬP NHẬT/CHỈNH SỬA PHIẾU (UPDATE)
        // - Đợi gọi tại: MaintenanceServiceImpl.java (Dòng 350)
        // - Nhiệm vụ: Ghi đè các thông tin thay đổi từ UpdateDTO vào Entity đang tồn
        // tại trong DB
        // - Annotation @BeanMapping(nullValuePropertyMappingStrategy = IGNORE):
        // -> Rất quan trọng: Nếu trường nào trong DTO bị null (do client không truyền),
        // MapStruct sẽ BỎ QUA không ghi đè, giúp giữ nguyên dữ liệu cũ trong Database!
        // =====================================================================================
        @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
        void updateFromDto(
                        MaintenanceRequestUpdateDTO dto,
                        @MappingTarget RepairRequest repairRequest);

        // =====================================================================================
        // HÀM 4: Dùng trong Luồng LẤY DANH SÁCH (GET ALL)
        // - Nhiệm vụ: Chuyển một danh sách (List) các Entity trong DB thành danh sách
        // (List) DTO Response
        // - MapStruct sẽ tự động gọi lặp lại hàm toResponse() cho từng phần tử trong
        // danh sách
        // =====================================================================================
        List<MaintenanceResponse> toResponseList(
                        List<RepairRequest> repairRequests);
}

package com.hms.service.maintenance;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import org.springframework.data.domain.Page;

public interface MaintenanceService {

    /**
     * Tạo yêu cầu bảo trì mới
     */
    MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto);

    /**
     * Cập nhật yêu cầu bảo trì
     */
    MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto);

    /**
     * Lấy chi tiết yêu cầu bảo trì theo ID
     */
    MaintenanceResponse getRequestById(Long id);

    /**
     * Lấy danh sách yêu cầu bảo trì có phân trang
     */
    Page<MaintenanceResponse> getAllRequests(
            String keywords,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    /**
     * Xóa yêu cầu bảo trì
     */
    void deleteRequest(Long id);
}
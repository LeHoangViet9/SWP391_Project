package com.hms.service.maintenance;


import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import org.springframework.data.domain.Page;



public interface MaintenanceService {

    MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto);

    MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto);

    MaintenanceResponse getRequestById(Long id);

    Page<MaintenanceResponse> getAllRequests(
            String keyword, // Dùng duy nhất keyword thay cho id, issueTitle, roomId,...
            MaintenanceSeverity severity,
            MaintenanceStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    void deleteRequest(Long id);

    /**
     * Maintenance staff chấp nhận yêu cầu → chuyển trạng thái sang IN_PROGRESS
     */
    MaintenanceResponse acceptRequest(Long requestId);

    /**
     * Maintenance staff từ chối yêu cầu → lưu vào deniedByIds, tìm người tiếp theo.
     * Nếu không còn ai khả dụng, trả về trạng thái PENDING và thông báo manager.
     */
    MaintenanceResponse denyRequest(Long requestId, String reason);
}

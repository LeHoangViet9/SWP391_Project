package com.hms.service.maintenance;


import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface MaintenanceService {

    MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto);

    MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto);

    MaintenanceResponse getRequestById(Long id);

    Page<MaintenanceResponse> searchAndFilterRequests(
            String keyword,
            MaintenanceStatus status,
            MaintenanceSeverity severity,
            Long roomId,
            Long assignedToId, // ✅ THÊM DÒNG NÀY: Để nhận ID nhân viên kỹ thuật từ Controller truyền xuống
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction);

    void deleteRequest(Long id);
}

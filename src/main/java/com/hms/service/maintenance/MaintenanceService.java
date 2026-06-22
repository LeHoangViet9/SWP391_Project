package com.hms.service.maintenance;


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

    Page<MaintenanceResponse> getAllRequests(
            Long id,
            String issueTitle,
            Long roomId,
            Long equipmentId,
            Long reportedBy,
            Long assignedTo,
            com.hms.common.enums.MaintenanceSeverity severity,
            com.hms.common.enums.MaintenanceStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    );

    void deleteRequest(Long id);
}

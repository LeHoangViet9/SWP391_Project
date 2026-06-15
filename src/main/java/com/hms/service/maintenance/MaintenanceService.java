package com.hms.service.maintenance;


import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;

import java.util.List;

public interface MaintenanceService {

    MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto);

    MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto);

    MaintenanceResponse getRequestById(Long id);

    List<MaintenanceResponse> getAllRequests();

    void deleteRequest(Long id);
}

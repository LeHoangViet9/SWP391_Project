package com.hms.service.maintenance.impl;

import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import com.hms.repository.maintenance.MaintenanceRepository;
import com.hms.service.maintenance.MaintenanceService;
import com.hms.service.maintenance.mapper.MaintenanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceMapper maintenanceMapper;

    @Override
    public MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto) {

        // ADDED: bắt buộc phải có ít nhất roomId hoặc equipmentId
        if (dto.getRoomId() == null && dto.getEquipmentId() == null) {
            throw new IllegalArgumentException(
                    "Maintenance request must have roomId or equipmentId"
            );
        }

        RepairRequest repairRequest = maintenanceMapper.toEntity(dto);

        // đảm bảo trạng thái mặc định khi tạo mới
        repairRequest.setStatus(MaintenanceStatus.PENDING);

        RepairRequest saved = maintenanceRepository.save(repairRequest);

        return maintenanceMapper.toResponse(saved);
    }

    @Override
    public MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto) {

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Maintenance request not found"
                                ));

        maintenanceMapper.updateFromDto(dto, repairRequest);

        // ADDED: nếu chuyển trạng thái sang COMPLETED thì lưu thời gian hoàn tất
        if (dto.getStatus() == MaintenanceStatus.COMPLETED) {
            repairRequest.setCompletedAt(LocalDateTime.now());
        }

        // ADDED: nếu status khác COMPLETED thì bỏ completedAt
        if (dto.getStatus() != null && dto.getStatus() != MaintenanceStatus.COMPLETED) {
            repairRequest.setCompletedAt(null);
        }

        RepairRequest updated = maintenanceRepository.save(repairRequest);

        return maintenanceMapper.toResponse(updated);
    }

    @Override
    public MaintenanceResponse getRequestById(Long id) {

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Maintenance request not found"
                                ));

        return maintenanceMapper.toResponse(repairRequest);
    }

    @Override
    public List<MaintenanceResponse> getAllRequests(
            MaintenanceStatus status,
            Long roomId,
            Long equipmentId,
            Long assignedTo
    ) {
        // ADDED: dùng query filter thay vì findAll()
        List<RepairRequest> requests = maintenanceRepository.filterRequests(
                status,
                roomId,
                equipmentId,
                assignedTo
        );

        return maintenanceMapper.toResponseList(requests);
    }

    @Override
    public void deleteRequest(Long id) {

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Maintenance request not found"
                                ));

        // ADDED: không xóa cứng, đổi trạng thái sang CANCELLED để giữ lịch sử
        repairRequest.setStatus(MaintenanceStatus.CANCELLED);
        repairRequest.setCompletedAt(null);

        maintenanceRepository.save(repairRequest);
    }
}
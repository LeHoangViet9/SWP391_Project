package com.hms.service.maintenance.impl;

import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import com.hms.repository.maintenance.MaintenanceRepository;
import com.hms.service.maintenance.MaintenanceService;
import com.hms.service.maintenance.mapper.MaintenanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceMapper maintenanceMapper;
    private final PageableUtils pageableUtils;

    @Override
    public MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto) {

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

        // nếu chuyển trạng thái sang COMPLETED thì lưu thời gian hoàn tất
        if (dto.getStatus() == MaintenanceStatus.COMPLETED) {
            repairRequest.setCompletedAt(LocalDateTime.now());
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
    public Page<MaintenanceResponse> getAllRequests(
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
    ) {
        List<RepairRequest> list = maintenanceRepository.findAll();
        java.util.stream.Stream<RepairRequest> stream = list.stream();

        if (id != null) {
            stream = stream.filter(r -> r.getId().equals(id));
        }
        if (org.springframework.util.StringUtils.hasText(issueTitle)) {
            String cleanTitle = issueTitle.trim().toLowerCase();
            stream = stream.filter(r -> r.getIssueTitle() != null && r.getIssueTitle().toLowerCase().contains(cleanTitle));
        }
        if (roomId != null) {
            stream = stream.filter(r -> r.getRoomId() != null && r.getRoomId().equals(roomId));
        }
        if (equipmentId != null) {
            stream = stream.filter(r -> r.getEquipmentId() != null && r.getEquipmentId().equals(equipmentId));
        }
        if (reportedBy != null) {
            stream = stream.filter(r -> r.getReportedBy() != null && r.getReportedBy().equals(reportedBy));
        }
        if (assignedTo != null) {
            stream = stream.filter(r -> r.getAssignedTo() != null && r.getAssignedTo().equals(assignedTo));
        }
        if (severity != null) {
            stream = stream.filter(r -> r.getSeverity() == severity);
        }
        if (status != null) {
            stream = stream.filter(r -> r.getStatus() == status);
        }

        List<RepairRequest> filteredList = stream.collect(java.util.stream.Collectors.toList());

        // Sorting
        java.util.Map<String, java.util.function.Function<RepairRequest, Comparable<?>>> extractors = new java.util.HashMap<>();
        extractors.put("id", RepairRequest::getId);
        extractors.put("issueTitle", RepairRequest::getIssueTitle);
        extractors.put("roomId", r -> r.getRoomId() != null ? r.getRoomId() : 0L);
        extractors.put("equipmentId", r -> r.getEquipmentId() != null ? r.getEquipmentId() : 0L);
        extractors.put("reportedBy", r -> r.getReportedBy() != null ? r.getReportedBy() : 0L);
        extractors.put("assignedTo", r -> r.getAssignedTo() != null ? r.getAssignedTo() : 0L);
        extractors.put("severity", r -> r.getSeverity() != null ? r.getSeverity().name() : "");
        extractors.put("status", r -> r.getStatus() != null ? r.getStatus().name() : "");
        extractors.put("createdAt", RepairRequest::getCreatedAt);

        pageableUtils.sortList(filteredList, sortBy, direction, extractors);

        // Pagination
        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        return pageableUtils.paginate(filteredList, pageable)
                .map(maintenanceMapper::toResponse);
    }

    @Override
    public void deleteRequest(Long id) {

        RepairRequest repairRequest =
                maintenanceRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Maintenance request not found"
                                ));

        maintenanceRepository.delete(repairRequest);
    }
}
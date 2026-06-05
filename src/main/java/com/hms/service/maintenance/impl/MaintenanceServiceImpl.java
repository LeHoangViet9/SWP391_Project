package com.hms.service.maintenance.impl;

import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.maintenance.RepairRequest;
import com.hms.repository.maintenance.MaintenanceRepository;
import com.hms.service.maintenance.MaintenanceService;
import com.hms.service.maintenance.mapper.MaintenanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceMapper maintenanceMapper;

    // Pagination config
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;

    /**
     * Tạo yêu cầu bảo trì mới
     */
    @Override
    public MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto) {
        // Convert DTO thành entity
        RepairRequest repairRequest = maintenanceMapper.toEntity(dto);

        // Đảm bảo trạng thái mặc định khi tạo mới là PENDING
        repairRequest.setStatus(MaintenanceStatus.PENDING);

        // Lưu vào database
        RepairRequest saved = maintenanceRepository.save(repairRequest);

        // Convert entity thành response DTO
        return maintenanceMapper.toResponse(saved);
    }

    /**
     * Cập nhật yêu cầu bảo trì
     */
    @Override
    public MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto) {
        // Tìm yêu cầu bảo trì theo ID, nếu không tìm thấy throw exception
        RepairRequest repairRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo trì không tồn tại"));

        // Cập nhật các trường từ DTO (bỏ qua các trường null)
        maintenanceMapper.updateFromDto(dto, repairRequest);

        // Nếu chuyển trạng thái sang COMPLETED thì lưu thời gian hoàn tất
        if (dto.getStatus() == MaintenanceStatus.COMPLETED) {
            repairRequest.setCompletedAt(LocalDateTime.now());
        }

        // Lưu cập nhật vào database
        RepairRequest updated = maintenanceRepository.save(repairRequest);

        // Convert entity thành response DTO
        return maintenanceMapper.toResponse(updated);
    }

    /**
     * Lấy chi tiết yêu cầu bảo trì theo ID
     */
    @Override
    public MaintenanceResponse getRequestById(Long id) {
        // Tìm yêu cầu bảo trì theo ID
        RepairRequest repairRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo trì không tồn tại"));

        // Convert entity thành response DTO
        return maintenanceMapper.toResponse(repairRequest);
    }

    /**
     * Lấy danh sách yêu cầu bảo trì có phân trang
     */
    @Override
    public Page<MaintenanceResponse> getAllRequests(
            String keywords,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction
    ) {
        // Xác định trang (nếu null thì dùng mặc định)
        page = (page == null || page < 1) ? DEFAULT_PAGE : page;
        size = (size == null || size < 1) ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);

        // Xác định hướng sắp xếp
        Sort.Direction sortDirection = direction == SortDirection.DESC ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = "id"; // Sắp xếp theo ID mặc định

        // Tạo Pageable object
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sortDirection, sortField));

        // Lấy tất cả yêu cầu bảo trì từ database (có phân trang)
        Page<RepairRequest> requests = maintenanceRepository.findAll(pageable);

        // Convert danh sách entity thành danh sách response DTO
        return requests.map(maintenanceMapper::toResponse);
    }

    /**
     * Xóa yêu cầu bảo trì
     */
    @Override
    public void deleteRequest(Long id) {
        // Tìm yêu cầu bảo trì theo ID
        RepairRequest repairRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu bảo trì không tồn tại"));

        // Xóa khỏi database
        maintenanceRepository.delete(repairRequest);
    }
}
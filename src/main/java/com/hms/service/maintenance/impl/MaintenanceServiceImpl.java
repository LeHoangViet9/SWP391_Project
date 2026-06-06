package com.hms.service.maintenance.impl;

import com.hms.common.enums.MaintenanceSeverity;
import com.hms.common.enums.MaintenanceStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.maintenance.request.MaintenanceRequestCreateDTO;
import com.hms.dto.maintenance.request.MaintenanceRequestUpdateDTO;
import com.hms.dto.maintenance.response.MaintenanceResponse;
import com.hms.entity.auth.User;
import com.hms.entity.equipment.Equipment;
import com.hms.entity.maintenance.RepairRequest;
import com.hms.entity.hotel.Room;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.equipment.EquipmentRepository;
import com.hms.repository.maintenance.MaintenanceRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.service.maintenance.MaintenanceService;
import com.hms.service.maintenance.mapper.MaintenanceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final RoomRepository roomRepository;
    private final EquipmentRepository equipmentRepository; // Thêm repo thiết bị
    private final UserRepository userRepository;           // Thêm repo user kỹ thuật
    private final MaintenanceMapper maintenanceMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    @Transactional
    public MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();
        RepairRequest repairRequest = maintenanceMapper.toEntity(dto);

        repairRequest.setStatus(MaintenanceStatus.PENDING);

        // 1. Xử lý gán Room nếu đơn thuộc về Phòng
        if (dto.getRoomId() != null) {
            Room room = roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.room.notfound", new Object[]{dto.getRoomId()}, locale)
                    ));

            room.setRoomStatus(RoomStatus.MAINTENANCE);
            repairRequest.setRoom(room);
        }

        // 2. BỔ SUNG: Xử lý gán Equipment nếu đơn thuộc về Thiết bị
        if (dto.getEquipmentId() != null) {
            Equipment equipment = equipmentRepository.findById(dto.getEquipmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.equipment.notfound", new Object[]{dto.getEquipmentId()}, locale)
                    ));
            repairRequest.setEquipment(equipment);
        }

        // 3. BỔ SUNG: Gán nhân viên xử lý ban đầu nếu có truyền lên từ lúc tạo
        if (dto.getAssignToId() != null) {
            User technician = userRepository.findById(dto.getAssignToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.user.notfound", new Object[]{dto.getAssignToId()}, locale)
                    ));
            repairRequest.setAssignedTo(technician);
        }

        RepairRequest saved = maintenanceRepository.save(repairRequest);
        return maintenanceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        // 1. Tìm đơn sửa chữa cũ trong DB
        RepairRequest repairRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.maintenance.notfound", new Object[]{id}, locale)
                ));

        MaintenanceStatus oldStatus = repairRequest.getStatus();

        // 2. Map các trường cơ bản (description, cost, status, severity, diagnosis, repairResult) từ DTO sang Entity
        maintenanceMapper.updateFromDto(dto, repairRequest);

        // 3. Tự tay cập nhật Kỹ thuật viên phụ trách (do đã ignore trong Mapper)
        if (dto.getAssignedToId() != null) {
            User technician = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.user.notfound", new Object[]{dto.getAssignedToId()}, locale)
                    ));
            repairRequest.setAssignedTo(technician);
        }

        // 4. KIỂM TRA LOGIC CHUYỂN TRẠNG THÁI (UPDATE THEO CÁC TRƯỜNG MỚI CỦA ÔNG)

        // Khi bắt đầu sửa (IN_PROGRESS): Ghi nhận ngày bắt đầu
        if (dto.getStatus() == MaintenanceStatus.IN_PROGRESS && oldStatus != MaintenanceStatus.IN_PROGRESS) {
            repairRequest.setStartDate(LocalDateTime.now());
        }

        // Khi sửa xong (COMPLETED): Ghi nhận ngày kết thúc + Đổi trạng thái phòng sang DIRTY
        if (dto.getStatus() == MaintenanceStatus.COMPLETED && oldStatus != MaintenanceStatus.COMPLETED) {

            // RÀNG BUỘC THỰC TẾ: Sửa xong thì phải điền kết quả sửa chữa, nếu không sẽ báo lỗi
            if (repairRequest.getRepairResult() == null || repairRequest.getRepairResult().trim().isEmpty()) {
                throw new IllegalArgumentException("Bắt buộc phải nhập kết quả sửa chữa khi hoàn thành đơn!");
            }

            repairRequest.setEndDate(LocalDateTime.now());

            if (repairRequest.getRoom() != null) {
                Room room = repairRequest.getRoom();
                room.setRoomStatus(RoomStatus.DIRTY); // Giao buồng phòng dọn dẹp
            }
        }

        // Khi hủy đơn (CANCELLED): Trả phòng về trống sẵn sàng
        if (dto.getStatus() == MaintenanceStatus.CANCELLED && oldStatus != MaintenanceStatus.CANCELLED) {
            if (repairRequest.getRoom() != null) {
                Room room = repairRequest.getRoom();
                room.setRoomStatus(RoomStatus.AVAILABLE);
            }
        }

        // 5. Lưu lại thay đổi
        RepairRequest updated = maintenanceRepository.save(repairRequest);
        return maintenanceMapper.toResponse(updated);
    }

    @Override
    public MaintenanceResponse getRequestById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest repairRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.maintenance.notfound", new Object[]{id}, locale)
                ));
        return maintenanceMapper.toResponse(repairRequest);
    }

    @Override
    public Page<MaintenanceResponse> searchAndFilterRequests(
            String keyword, MaintenanceStatus status, MaintenanceSeverity severity, Long roomId,
            Long assignedToId,
            Integer page, Integer size, SortField sortBy, SortDirection direction) {

        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;

        return maintenanceRepository.searchAndFilterRequests(cleanKeyword, status, severity, roomId, assignedToId, pageable)
                .map(maintenanceMapper::toResponse);
    }

    @Override
    @Transactional
    public void deleteRequest(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest repairRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.maintenance.notfound", new Object[]{id}, locale)
                ));

        if (repairRequest.getRoom() != null && repairRequest.getStatus() != MaintenanceStatus.COMPLETED) {
            Room room = repairRequest.getRoom();
            room.setRoomStatus(RoomStatus.AVAILABLE);
        }

        maintenanceRepository.delete(repairRequest);
    }
}
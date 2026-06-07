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
import com.hms.entity.hotel.Room;
import com.hms.entity.maintenance.RepairRequest;
import com.hms.repository.auth.UserRepository;
import com.hms.repository.equipment.EquipmentRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.maintenance.MaintenanceRepository;
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
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final MaintenanceMapper maintenanceMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;

    @Override
    @Transactional
    public MaintenanceResponse createRequest(MaintenanceRequestCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        if (dto.getRoomId() == null && dto.getEquipmentId() == null) {
            throw new IllegalArgumentException(
                    messageSource.getMessage("error.maintenance.target.required", null, locale)
            );
        }

        RepairRequest repairRequest = maintenanceMapper.toEntity(dto);
        repairRequest.setStatus(MaintenanceStatus.PENDING);

        User reporter = userRepository.findById(dto.getReportedBy())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.user.notfound", new Object[]{dto.getReportedBy()}, locale)
                ));
        repairRequest.setReportedBy(reporter);

        if (dto.getRoomId() != null) {
            Room room = roomRepository.findById(dto.getRoomId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.room.notfound", new Object[]{dto.getRoomId()}, locale)
                    ));

            room.setRoomStatus(RoomStatus.MAINTENANCE);
            roomRepository.save(room);
            repairRequest.setRoom(room);
        }

        if (dto.getEquipmentId() != null) {
            Equipment equipment = equipmentRepository.findById(dto.getEquipmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.equipment.notfound", new Object[]{dto.getEquipmentId()}, locale)
                    ));
            repairRequest.setEquipment(equipment);
        }

        RepairRequest saved = maintenanceRepository.save(repairRequest);
        return maintenanceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceResponse updateRequest(Long id, MaintenanceRequestUpdateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        RepairRequest repairRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.maintenance.notfound", new Object[]{id}, locale)
                ));

        MaintenanceStatus oldStatus = repairRequest.getStatus();

        maintenanceMapper.updateFromDto(dto, repairRequest);

        if (dto.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            messageSource.getMessage("error.user.notfound", new Object[]{dto.getAssignedToId()}, locale)
                    ));
            repairRequest.setAssignedTo(assignedUser);
        }

        if (dto.getStatus() == MaintenanceStatus.IN_PROGRESS && oldStatus != MaintenanceStatus.IN_PROGRESS) {
            repairRequest.setStartDate(LocalDateTime.now());
        }

        if (dto.getStatus() == MaintenanceStatus.COMPLETED && oldStatus != MaintenanceStatus.COMPLETED) {
            repairRequest.setEndDate(LocalDateTime.now());

            if (repairRequest.getRoom() != null) {
                Room room = repairRequest.getRoom();
                room.setRoomStatus(RoomStatus.DIRTY);
                roomRepository.save(room);
            }
        }

        if (dto.getStatus() == MaintenanceStatus.CANCELLED && oldStatus != MaintenanceStatus.CANCELLED) {
            if (repairRequest.getRoom() != null
                    && repairRequest.getRoom().getRoomStatus() == RoomStatus.MAINTENANCE) {
                Room room = repairRequest.getRoom();
                room.setRoomStatus(RoomStatus.AVAILABLE);
                roomRepository.save(room);
            }
        }

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
            String keyword,
            MaintenanceStatus status,
            MaintenanceSeverity severity,
            Long roomId,
            Long assignedToId,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        Pageable pageable = pageableUtils.createPageable(page, size, sortBy.getField(), direction);

        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty())
                ? keyword.trim()
                : null;

        return maintenanceRepository
                .searchAndFilterRequests(cleanKeyword, status, severity, roomId, assignedToId, pageable)
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

        if (repairRequest.getRoom() != null
                && repairRequest.getStatus() != MaintenanceStatus.COMPLETED
                && repairRequest.getRoom().getRoomStatus() == RoomStatus.MAINTENANCE) {

            Room room = repairRequest.getRoom();
            room.setRoomStatus(RoomStatus.AVAILABLE);
            roomRepository.save(room);
        }

        maintenanceRepository.delete(repairRequest);
    }
}
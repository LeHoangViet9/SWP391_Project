package com.hms.service.hotel.impl;

import java.util.Locale;
import java.util.List;

import com.hms.common.enums.AccountStatus; // 🛠️ Đảm bảo import enum trạng thái của dự án bạn
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.service.hotel.mapper.RoomTypeMapper;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.hms.common.enums.RoomStatus;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.customer.CustomerFeedbackRepository;

import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.dto.roomtype.request.RoomTypeRequest;
import com.hms.entity.hotel.RoomType;
import com.hms.entity.hotel.RoomTypeImage;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.hotel.IRoomTypeService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomTypeServiceImpl implements IRoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final RoomTypeMapper roomTypeMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final CustomerFeedbackRepository customerFeedbackRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<RoomTypeResponse> getAllRoomType(
            String keyword,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        Pageable pageable = pageableUtils.createPageable(
                page,
                size,
                sortBy.getField(),
                direction
        );

        return roomTypeRepository
                .searchRoomTypes(keyword, pageable)
                .map(roomTypeMapper::toResponse)
                .map(this::populateRatingStats);
    }



    @Override
    @Transactional(readOnly = true)
    public RoomTypeResponse getRoomTypeById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        RoomType roomType = roomTypeRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.roomtype.notfound", null, locale)));
        RoomTypeResponse response = roomTypeMapper.toResponse(roomType);
        return populateRatingStats(response);
    }

    @Override
    @Transactional
    public RoomTypeResponse createRoomType(RoomTypeRequest request, List<MultipartFile> images) {
        Locale locale = LocaleContextHolder.getLocale();

        if (roomTypeRepository.existsByTypeNameAndStatus(request.getTypeName(), AccountStatus.ACTIVE)) {
            throw new ConflictException(messageSource.getMessage("error.roomtype.exists", null, locale));
        }

        RoomType roomType = roomTypeMapper.toEntity(request);
        roomType.setStatus(AccountStatus.ACTIVE);
        roomType.setImages(new java.util.ArrayList<>());
        addRoomTypeImages(roomType, images);

        RoomType saved = roomTypeRepository.save(roomType);
        RoomTypeResponse response = roomTypeMapper.toResponse(saved);
        return populateRatingStats(response);
    }

    @Override
    @Transactional
    public RoomTypeResponse updateRoomType(Long id, RoomTypeRequest request, List<MultipartFile> images) {
        Locale locale = LocaleContextHolder.getLocale();

        RoomType roomType = roomTypeRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.roomtype.notfound", null, locale)));

        if (!roomType.getTypeName().equalsIgnoreCase(request.getTypeName())
                && roomTypeRepository.existsByTypeNameAndIdNotAndStatus(request.getTypeName(), id,
                        AccountStatus.ACTIVE)) {
            throw new ConflictException(messageSource.getMessage("error.roomtype.exists", null, locale));
        }

        roomTypeMapper.updateRoomTypeFromRequest(request, roomType);
        addRoomTypeImages(roomType, images);
        RoomType updated = roomTypeRepository.save(roomType);
        RoomTypeResponse response = roomTypeMapper.toResponse(updated);
        return populateRatingStats(response);
    }

    @Override
    @Transactional
    public void deleteRoomTypeByID(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        RoomType roomType = roomTypeRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.roomtype.notfound", null, locale)));

        if (roomRepository.existsByRoomTypeIdAndRoomStatusNot(id, RoomStatus.INACTIVE)) {
            throw new ConflictException(messageSource.getMessage("error.roomtype.inuse.rooms", null, locale));
        }

        if (bookingRepository.existsByRoomTypeId(id)) {
            throw new ConflictException(messageSource.getMessage("error.roomtype.inuse.bookings", null, locale));
        }

        roomType.setStatus(AccountStatus.INACTIVE);
        roomTypeRepository.save(roomType);
    }

    private RoomTypeResponse populateRatingStats(RoomTypeResponse response) {
        if (response == null) return null;
        List<Object[]> stats = customerFeedbackRepository.getRatingStatsByRoomTypeId(response.getId());
        if (stats != null && !stats.isEmpty() && stats.get(0) != null) {
            Object[] row = stats.get(0);
            Double avg = (Double) row[0];
            Long count = (Long) row[1];
            if (avg != null) {
                avg = Math.round(avg * 10.0) / 10.0;
            }
            response.setAverageRating(avg != null ? avg : 0.0);
            response.setReviewCount(count != null ? count : 0L);
        } else {
            response.setAverageRating(0.0);
            response.setReviewCount(0L);
        }
        return response;
    }

    private void addRoomTypeImages(RoomType roomType, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        try {
            Path uploadPath = Paths.get("uploads/roomtypes")
                    .toAbsolutePath()
                    .normalize();
            Files.createDirectories(uploadPath);

            boolean hasPrimary = roomType.getImages() != null
                    && roomType.getImages().stream().anyMatch(img -> Boolean.TRUE.equals(img.getIsPrimary()));

            for (MultipartFile image : images) {
                if (image == null || image.isEmpty()) {
                    continue;
                }

                String originalName = image.getOriginalFilename() == null
                        ? "image.jpg"
                        : StringUtils.cleanPath(image.getOriginalFilename());

                String extension = ".jpg";
                int dotIndex = originalName.lastIndexOf('.');
                if (dotIndex >= 0) {
                    extension = originalName.substring(dotIndex);
                }

                String safeTypeName = roomType.getTypeName() == null
                        ? "roomtype"
                        : roomType.getTypeName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
                safeTypeName = safeTypeName.replaceAll("(^-|-$)", "");
                if (safeTypeName.isBlank()) {
                    safeTypeName = "roomtype";
                }

                String fileName = safeTypeName + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
                Path targetPath = uploadPath.resolve(fileName).normalize();

                Files.copy(image.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                RoomTypeImage roomTypeImage = RoomTypeImage.builder()
                        .roomType(roomType)
                        .imageUrl("/uploads/roomtypes/" + fileName)
                        .isPrimary(!hasPrimary)
                        .build();

                roomType.getImages().add(roomTypeImage);
                hasPrimary = true;
            }
        } catch (IOException ex) {
            throw new ConflictException("Could not save room type images");
        }
    }
}

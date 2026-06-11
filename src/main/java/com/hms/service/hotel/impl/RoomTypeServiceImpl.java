package com.hms.service.hotel.impl;

import java.util.Locale;

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

import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.dto.roomtype.request.RoomTypeRequest;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.hotel.IRoomTypeService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomTypeServiceImpl implements IRoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final RoomTypeMapper roomTypeMapper;
    private final MessageSource messageSource;
    private final PageableUtils pageableUtils;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<RoomTypeResponse> getAllRoomType(
            Long id,
            String typeName,
            java.math.BigDecimal price,
            Integer maxGuests,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        java.util.List<RoomType> list = roomTypeRepository.findAllByStatus(AccountStatus.ACTIVE);

        java.util.List<RoomType> filteredList = filterRoomTypes(list, id, typeName, price, maxGuests);

        sortRoomTypes(filteredList, sortBy, direction);

        return paginateRoomTypes(filteredList, page, size, sortBy, direction);
    }

    private java.util.List<RoomType> filterRoomTypes(
            java.util.List<RoomType> list,
            Long id,
            String typeName,
            java.math.BigDecimal price,
            Integer maxGuests) {

        java.util.stream.Stream<RoomType> stream = list.stream();

        if (id != null) {
            stream = stream.filter(rt -> rt.getId().equals(id));
        }
        if (org.springframework.util.StringUtils.hasText(typeName)) {
            String cleanTypeName = typeName.trim().toLowerCase();
            stream = stream.filter(rt -> rt.getTypeName() != null && rt.getTypeName().toLowerCase().contains(cleanTypeName));
        }
        if (price != null) {
            stream = stream.filter(rt -> rt.getBasePrice() != null && rt.getBasePrice().compareTo(price) <= 0);
        }
        if (maxGuests != null) {
            stream = stream.filter(rt -> rt.getMaxGuests() != null && rt.getMaxGuests() >= maxGuests);
        }

        return stream.collect(java.util.stream.Collectors.toList());
    }

    private void sortRoomTypes(
            java.util.List<RoomType> list,
            SortField sortBy,
            SortDirection direction) {

        java.util.Map<String, java.util.function.Function<RoomType, Comparable<?>>> extractors = new java.util.HashMap<>();
        extractors.put("id", RoomType::getId);
        extractors.put("typeName", RoomType::getTypeName);
        extractors.put("basePrice", RoomType::getBasePrice);
        extractors.put("maxGuests", RoomType::getMaxGuests);

        pageableUtils.sortList(list, sortBy, direction, extractors);
    }

    private Page<RoomTypeResponse> paginateRoomTypes(
            java.util.List<RoomType> list,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        int total = list.size();
        int startPage = (page != null) ? page : 0;
        int pageSize = (size != null) ? size : 10;
        int start = Math.min(startPage * pageSize, total);
        int end = Math.min(start + pageSize, total);

        java.util.List<RoomTypeResponse> pageContent = list.subList(start, end).stream()
                .map(roomTypeMapper::toResponse)
                .collect(java.util.stream.Collectors.toList());

        Pageable pageable = pageableUtils.createPageable(startPage, pageSize, sortBy.getField(), direction);
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, total);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomTypeResponse getRoomTypeById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();

        RoomType roomType = roomTypeRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.roomtype.notfound", null, locale)));
        return roomTypeMapper.toResponse(roomType);
    }

    @Override
    @Transactional
    public RoomTypeResponse createRoomType(RoomTypeRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        if (roomTypeRepository.existsByTypeNameAndStatus(request.getTypeName(), AccountStatus.ACTIVE)) {
            throw new ConflictException(messageSource.getMessage("error.roomtype.exists", null, locale));
        }

        RoomType roomType = roomTypeMapper.toEntity(request);
        roomType.setStatus(AccountStatus.ACTIVE);

        RoomType saved = roomTypeRepository.save(roomType);
        return roomTypeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RoomTypeResponse updateRoomType(Long id, RoomTypeRequest request) {
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
        RoomType updated = roomTypeRepository.save(roomType);
        return roomTypeMapper.toResponse(updated);
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
}
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

    @Override
    @Transactional(readOnly = true)
    public Page<RoomTypeResponse> getAllRoomType(
            String keywords,
            Integer maxGuests,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        String searchKeywords = StringUtils.hasText(keywords) ? keywords.trim() : "";

        Pageable pageable = pageableUtils.createPageable(
                page,
                size,
                sortBy.getField(),
                direction
        );

        if (maxGuests != null) {
            return roomTypeRepository
                    .findByTypeNameContainingIgnoreCaseAndMaxGuestsGreaterThanEqualAndStatus(
                            searchKeywords,
                            maxGuests,
                            AccountStatus.ACTIVE,
                            pageable
                    )
                    .map(roomTypeMapper::toResponse);
        }

        return roomTypeRepository
                .findByTypeNameContainingIgnoreCaseAndStatus(searchKeywords, AccountStatus.ACTIVE, pageable)
                .map(roomTypeMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public RoomTypeResponse getRoomTypeById(Long id){
        Locale locale = LocaleContextHolder.getLocale();

        RoomType roomType = roomTypeRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));
        return roomTypeMapper.toResponse(roomType);
    }

    @Override
    @Transactional
    public RoomTypeResponse createRoomType(RoomTypeRequest request){
        Locale locale = LocaleContextHolder.getLocale();

        if(roomTypeRepository.existsByTypeNameAndStatus(request.getTypeName(), AccountStatus.ACTIVE)){
            throw new ConflictException(messageSource.getMessage("error.roomtype.exists", null, locale));
        }

        RoomType roomType = roomTypeMapper.toEntity(request);
        roomType.setStatus(AccountStatus.ACTIVE);

        RoomType saved = roomTypeRepository.save(roomType);
        return roomTypeMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public RoomTypeResponse updateRoomType(Long id, RoomTypeRequest request){
        Locale locale = LocaleContextHolder.getLocale();

        RoomType roomType = roomTypeRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));

        if (!roomType.getTypeName().equalsIgnoreCase(request.getTypeName())
                && roomTypeRepository.existsByTypeNameAndIdNotAndStatus(request.getTypeName(), id, AccountStatus.ACTIVE)) {
            throw new ConflictException(messageSource.getMessage("error.roomtype.exists", null, locale));
        }

        roomTypeMapper.updateRoomTypeFromRequest(request, roomType);
        RoomType updated = roomTypeRepository.save(roomType);
        return roomTypeMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteRoomTypeByID(Long id){
        Locale locale = LocaleContextHolder.getLocale();

        RoomType roomType = roomTypeRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(messageSource.getMessage("error.roomtype.notfound", null, locale)));
        roomType.setStatus(AccountStatus.INACTIVE);
        roomTypeRepository.save(roomType);
    }
}
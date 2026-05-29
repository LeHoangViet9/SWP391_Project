package com.hms.service.hotel.impl;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.hms.service.hotel.mapper.RoomTypeMapper;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

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

    @Override
    public List<RoomTypeResponse> getAllRoomType(){
        List<RoomType> roomTypes = roomTypeRepository.findAll();
        return roomTypeMapper.toResponseList(roomTypes);

    }

    @Override
    public RoomTypeResponse getRoomTypeById(Long id){
        Locale locale = LocaleContextHolder.getLocale();
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.roomtype.notfound", null, locale)));
        return roomTypeMapper.toResponse(roomType);
    }

    @Override
    public RoomTypeResponse createRoomType(RoomTypeRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        if(roomTypeRepository.existsByTypeName(request.getTypeName())){
            throw new RuntimeException(messageSource.getMessage("error.roomtype.exists",null,locale));
        }
        RoomType roomType = roomTypeMapper.toEntity(request);
        RoomType saved = roomTypeRepository.save(roomType);
        return roomTypeMapper.toResponse(saved);
    }

    @Override
    public RoomTypeResponse updateRoomType(Long id, RoomTypeRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.roomtype.notfound",null,locale)));
        String newTypeName = request.getTypeName();
        if(newTypeName == null || newTypeName.isBlank()){
            throw new RuntimeException(messageSource.getMessage("error.roomtype.name.required", null, locale));
        }
        if(roomTypeRepository.existsByTypeNameAndIdNot(newTypeName, id)){
            throw new RuntimeException(messageSource.getMessage("error.roomtype.exists",null,locale));
        }
        roomTypeMapper.updateRoomTypeFromRequest(request, roomType);
        RoomType updated = roomTypeRepository.save(roomType);
        return roomTypeMapper.toResponse(updated);
    }

    @Override
    public void deleteRoomTypeByID(Long id){
        Locale locale = LocaleContextHolder.getLocale();
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.roomtype.notfound",null,locale)));
        roomTypeRepository.delete(roomType);
    }

}

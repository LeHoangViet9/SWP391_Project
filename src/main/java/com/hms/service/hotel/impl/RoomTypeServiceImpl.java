package com.hms.service.hotel.impl;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import com.hms.dto.response.RoomTypeResponse;
import com.hms.dto.roomtype.RoomTypeRequest;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.hotel.IRoomTypeService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomTypeServiceImpl implements IRoomTypeService {

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private MessageSource messageSource;

    @Override
    public List<RoomTypeResponse> getAllRoomType(){
        return roomTypeRepository.findAll().stream()
                .map(this::toRoomTypeResponse)
                .collect(Collectors.toList());
    }

    @Override
    public RoomTypeResponse getRoomTypeById(Long id){
        Locale locale = LocaleContextHolder.getLocale();
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.roomtype.notfound", null, locale)));
        return toRoomTypeResponse(roomType);
    }

    @Override
    public RoomTypeResponse createRoomType(RoomTypeRequest request){
        Locale locale = LocaleContextHolder.getLocale();
        if(roomTypeRepository.existsByTypeName(request.getTypeName())){
            throw new RuntimeException(messageSource.getMessage("error.roomtype.exists",null,locale));
        }
        RoomType roomType = RoomType.builder()
                .typeName(request.getTypeName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .maxGuests(request.getMaxGuests())
                .build();
        RoomType saved = roomTypeRepository.save(roomType);
        return toRoomTypeResponse(saved);
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
        roomType.setTypeName(request.getTypeName());
        roomType.setDescription(request.getDescription());
        roomType.setBasePrice(request.getBasePrice());
        roomType.setMaxGuests(request.getMaxGuests());

        RoomType updated = roomTypeRepository.save(roomType);
        return toRoomTypeResponse(updated);
    }

    @Override
    public void deleteRoomTypeByID(Long id){
        Locale locale = LocaleContextHolder.getLocale();
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.roomtype.notfound",null,locale)));
        roomTypeRepository.delete(roomType);
    }

    private RoomTypeResponse toRoomTypeResponse(RoomType roomType){
        return new RoomTypeResponse(
                roomType.getId(),
                roomType.getTypeName(),
                roomType.getDescription(),
                roomType.getBasePrice(),
                roomType.getMaxGuests());
    }
}

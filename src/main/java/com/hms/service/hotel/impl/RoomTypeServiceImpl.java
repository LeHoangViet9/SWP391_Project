package com.hms.service.hotel.impl;

import java.util.List;
import java.util.Locale;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.hotel.IRoomTypeService;

import lombok.RequiredArgsConstructor;
@Service
@RequiredArgsConstructor
public class RoomTypeServiceImpl implements IRoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final MessageSource messageSource;

    @Override
    public List<RoomType> getAllRoomType(){
        return roomTypeRepository.findAll();
    }

    @Override
    public RoomType getRoomTypeById(int id){
        Locale locale = LocaleContextHolder.getLocale();
        return roomTypeRepository.findById(id).orElseThrow(() -> new RuntimeException(messageSource.getMessage("error.roomtype.notfound",null, locale)));
    }
    @Override
    public RoomType createRoomType(RoomType roomType){
        Locale locale = LocaleContextHolder.getLocale();
        if(roomTypeRepository.existsByTypeName(roomType.getTypeName())){
            throw new RuntimeException(messageSource.getMessage("error.roomtype.exists",null,locale));
        }
        return roomTypeRepository.save(roomType);
    }

    @Override
    public RoomType updateRoomType(int id, RoomType request){
        Locale locale = LocaleContextHolder.getLocale();
        RoomType roomType = getRoomTypeById(id);
        String newTypeName = request.getTypeName();
        if(newTypeName == null || newTypeName.isEmpty()){
            throw new RuntimeException(
                    messageSource.getMessage("error.roomtype.name.required", null, locale)
            );
        }
        if(roomTypeRepository.existsByTypeName(newTypeName) &&
        !roomType.getTypeName().equalsIgnoreCase(newTypeName)){
            throw new RuntimeException(
                    messageSource.getMessage("error.roomtype.exists", null, locale)
            );
        }
        roomType.setTypeName(request.getTypeName());
        roomType.setDescription(request.getDescription());
        roomType.setBasePrice(request.getBasePrice());
        roomType.setMaxGuests(request.getMaxGuests());
        return roomTypeRepository.save(roomType);
    }

    @Override
    public void deleteRoomTypeByID(int id){
        RoomType roomType = getRoomTypeById(id);
        roomTypeRepository.delete(roomType);
    }

}

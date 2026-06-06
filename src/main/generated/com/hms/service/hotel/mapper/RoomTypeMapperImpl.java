package com.hms.service.hotel.mapper;

import com.hms.dto.roomtype.request.RoomTypeRequest;
import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.entity.hotel.RoomType;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-06T11:14:43+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Oracle Corporation)"
)
@Component
public class RoomTypeMapperImpl implements RoomTypeMapper {

    @Override
    public RoomType toEntity(RoomTypeRequest request) {
        if ( request == null ) {
            return null;
        }

        RoomType.RoomTypeBuilder roomType = RoomType.builder();

        roomType.typeName( request.getTypeName() );
        roomType.description( request.getDescription() );
        roomType.basePrice( request.getBasePrice() );
        roomType.maxGuests( request.getMaxGuests() );

        return roomType.build();
    }

    @Override
    public RoomTypeResponse toResponse(RoomType roomType) {
        if ( roomType == null ) {
            return null;
        }

        RoomTypeResponse roomTypeResponse = new RoomTypeResponse();

        roomTypeResponse.setId( roomType.getId() );
        roomTypeResponse.setTypeName( roomType.getTypeName() );
        roomTypeResponse.setDescription( roomType.getDescription() );
        roomTypeResponse.setBasePrice( roomType.getBasePrice() );
        roomTypeResponse.setMaxGuests( roomType.getMaxGuests() );
        if ( roomType.getStatus() != null ) {
            roomTypeResponse.setStatus( roomType.getStatus().name() );
        }

        return roomTypeResponse;
    }

    @Override
    public void updateRoomTypeFromRequest(RoomTypeRequest request, RoomType roomType) {
        if ( request == null ) {
            return;
        }

        roomType.setTypeName( request.getTypeName() );
        roomType.setDescription( request.getDescription() );
        roomType.setBasePrice( request.getBasePrice() );
        roomType.setMaxGuests( request.getMaxGuests() );
    }

    @Override
    public List<RoomTypeResponse> toResponseList(List<RoomType> roomType) {
        if ( roomType == null ) {
            return null;
        }

        List<RoomTypeResponse> list = new ArrayList<RoomTypeResponse>( roomType.size() );
        for ( RoomType roomType1 : roomType ) {
            list.add( toResponse( roomType1 ) );
        }

        return list;
    }
}

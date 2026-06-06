package com.hms.service.hotel.mapper;

import com.hms.dto.room.request.RoomRequest;
import com.hms.dto.room.response.RoomResponse;
import com.hms.dto.roomtype.response.RoomTypeResponse;
import com.hms.entity.hotel.Room;
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
public class RoomMapperImpl implements RoomMapper {

    @Override
    public RoomResponse toResponse(Room room) {
        if ( room == null ) {
            return null;
        }

        RoomResponse roomResponse = new RoomResponse();

        roomResponse.setId( room.getId() );
        roomResponse.setRoomNumber( room.getRoomNumber() );
        roomResponse.setRoomType( roomTypeToRoomTypeResponse( room.getRoomType() ) );
        roomResponse.setRoomStatus( room.getRoomStatus() );
        roomResponse.setFloorNumber( room.getFloorNumber() );
        roomResponse.setDescription( room.getDescription() );
        roomResponse.setImageRoom( room.getImageRoom() );

        return roomResponse;
    }

    @Override
    public Room toEntity(RoomRequest request) {
        if ( request == null ) {
            return null;
        }

        Room.RoomBuilder room = Room.builder();

        room.roomNumber( request.getRoomNumber() );
        room.floorNumber( request.getFloorNumber() );
        room.description( request.getDescription() );
        room.imageRoom( request.getImageRoom() );

        return room.build();
    }

    @Override
    public void updateRoomFromRequest(RoomRequest request, Room room) {
        if ( request == null ) {
            return;
        }

        room.setRoomNumber( request.getRoomNumber() );
        room.setFloorNumber( request.getFloorNumber() );
        room.setDescription( request.getDescription() );
        room.setImageRoom( request.getImageRoom() );
    }

    @Override
    public List<RoomResponse> toResponseList(List<Room> rooms) {
        if ( rooms == null ) {
            return null;
        }

        List<RoomResponse> list = new ArrayList<RoomResponse>( rooms.size() );
        for ( Room room : rooms ) {
            list.add( toResponse( room ) );
        }

        return list;
    }

    protected RoomTypeResponse roomTypeToRoomTypeResponse(RoomType roomType) {
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
}

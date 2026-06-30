package com.hms.service.booking.mapper;

import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.RoomGuestAllocation;
import com.hms.dto.booking.request.RoomGuestRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    // Chỉ map các field scalar; các FK object (customer, roomType, room)
    // và các field do service tính toán (bookingStatus, pricePerNight, totalPrice)
    // được bỏ qua để service tự set
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "roomType", ignore = true)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "rooms", ignore = true)
    @Mapping(target = "guestAllocations", ignore = true)
    @Mapping(target = "bookingStatus", ignore = true)
    @Mapping(target = "pricePerNight", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "holdExpiresAt", ignore = true)
    @Mapping(target = "invoice", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    Booking toEntity(BookingRequest request);

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.fullName", target = "customerName")
    @Mapping(source = "roomType.id", target = "roomTypeId")
    @Mapping(source = "roomType.typeName", target = "roomTypeName")
    @Mapping(source = "room.id", target = "roomId")
    @Mapping(source = "room.roomNumber", target = "roomNumber")
    @Mapping(target = "hasFeedback", ignore = true)
    @Mapping(target = "roomIds", expression = "java(booking.getRooms().stream().map(room -> room.getId()).toList())")
    @Mapping(target = "roomNumbers", expression = "java(booking.getRooms().stream().map(room -> room.getRoomNumber()).toList())")
    @Mapping(source = "guestAllocations", target = "roomGuests")
    BookingResponse toResponse(Booking booking);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "roomType", ignore = true)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "rooms", ignore = true)
    @Mapping(target = "guestAllocations", ignore = true)
    @Mapping(target = "bookingStatus", ignore = true)
    @Mapping(target = "pricePerNight", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "holdExpiresAt", ignore = true)
    @Mapping(target = "invoice", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    void updateBookingFromRequest(BookingRequest request, @MappingTarget Booking booking);

    default RoomGuestRequest toRoomGuestRequest(RoomGuestAllocation allocation) {
        return RoomGuestRequest.builder()
                .adults(allocation.getAdults())
                .children(allocation.getChildren())
                .infants(allocation.getInfants())
                .build();
    }
}


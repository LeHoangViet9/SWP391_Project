package com.hms.service.booking.mapper;

import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.entity.booking.Booking;
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
    @Mapping(target = "bookingStatus", ignore = true)
    @Mapping(target = "pricePerNight", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "invoice", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    Booking toEntity(BookingRequest request);

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.fullName", target = "customerName")
    @Mapping(source = "roomType.id", target = "roomTypeId")
    @Mapping(source = "roomType.typeName", target = "roomTypeName")
    BookingResponse toResponse(Booking booking);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "roomType", ignore = true)
    @Mapping(target = "room", ignore = true)
    @Mapping(target = "bookingStatus", ignore = true)
    @Mapping(target = "pricePerNight", ignore = true)
    @Mapping(target = "totalPrice", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "invoice", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    void updateBookingFromRequest(BookingRequest request, @MappingTarget Booking booking);
}


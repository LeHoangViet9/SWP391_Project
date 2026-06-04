package com.hms.service.booking.mapper;

import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.entity.booking.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    Booking toEntity(BookingRequest request);

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.fullName", target = "customerName")

    @Mapping(source = "roomType.id", target = "roomTypeId")
    @Mapping(source = "roomType.typeName", target = "roomTypeName")
    BookingResponse toResponse(Booking booking);

    void updateBookingFromRequest(BookingRequest request, @MappingTarget Booking booking );
}

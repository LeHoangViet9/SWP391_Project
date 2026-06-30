package com.hms.service.customer.mapper;

import com.hms.dto.customer.response.CustomerFeedbackResponse;
import com.hms.entity.customer.CustomerFeedback;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CustomerFeedbackMapper {

    @Mapping(source = "booking.id", target = "bookingId")
    @Mapping(source = "customer.fullName", target = "customerName")
    @Mapping(source = "booking.roomType.typeName", target = "roomTypeName")
    CustomerFeedbackResponse toResponse(CustomerFeedback feedback);
}

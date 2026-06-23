package com.hms.service.booking.mapper;

import com.hms.dto.invoice.request.InvoiceRequest;
import com.hms.dto.invoice.response.InvoiceResponse;
import com.hms.entity.booking.Invoice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface InvoiceMapper {
    InvoiceMapper INSTANCE = Mappers.getMapper(InvoiceMapper.class);

    // 1. Map từ Entity sang InvoiceResponse mới của bạn
    @Mapping(target = "invoiceId", source = "id")
    @Mapping(target = "bookingId", source = "booking.id")
    @Mapping(target = "customerName", source = "booking.customer.fullName")
    @Mapping(target = "roomNumber", source = "booking.room.roomNumber")
    @Mapping(target = "totalAmount", source = "amount") // Map amount sang totalAmount
    InvoiceResponse toResponse(Invoice invoice);

    // 2. Map ngược từ Request sang Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "booking", ignore = true)
    @Mapping(target = "amount", ignore = true)
    @Mapping(target = "paymentStatus", ignore = true)
    @Mapping(target = "paidAt", ignore = true)// Map đúng chữ sai chính tả sang DB
    Invoice toEntity(InvoiceRequest request);
}
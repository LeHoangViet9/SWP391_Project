package com.hms.service.customer.mapper;

import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.entity.customer.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    Customer toEntity(CustomerCreateDTO dto);
    @Mapping(source = "idNumberCard", target = "idCard")
    CustomerResponse toResponse(Customer customer);
    void updateCustomerFromDto(
            CustomerCreateDTO dto,
            @MappingTarget Customer customer
    );

}

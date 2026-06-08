package com.hms.service.customer.mapper;

import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.request.CustomerUpdateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.entity.customer.Customer;
import org.mapstruct.*;

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
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateCustomerFromDto(CustomerUpdateDTO dto, @MappingTarget Customer customer);

}

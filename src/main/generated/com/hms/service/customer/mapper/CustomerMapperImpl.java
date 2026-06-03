package com.hms.service.customer.mapper;

import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.entity.customer.Customer;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-03T07:52:43+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Oracle Corporation)"
)
@Component
public class CustomerMapperImpl implements CustomerMapper {

    @Override
    public Customer toEntity(CustomerCreateDTO dto) {
        if ( dto == null ) {
            return null;
        }

        Customer.CustomerBuilder customer = Customer.builder();

        customer.fullName( dto.getFullName() );
        customer.email( dto.getEmail() );
        customer.phone( dto.getPhone() );
        customer.idType( dto.getIdType() );
        customer.idNumberCard( dto.getIdNumberCard() );
        customer.nationality( dto.getNationality() );

        return customer.build();
    }

    @Override
    public CustomerResponse toResponse(Customer customer) {
        if ( customer == null ) {
            return null;
        }

        CustomerResponse.CustomerResponseBuilder customerResponse = CustomerResponse.builder();

        customerResponse.idCard( customer.getIdNumberCard() );
        customerResponse.id( customer.getId() );
        customerResponse.fullName( customer.getFullName() );
        customerResponse.email( customer.getEmail() );
        customerResponse.phone( customer.getPhone() );
        if ( customer.getStatus() != null ) {
            customerResponse.status( customer.getStatus().name() );
        }
        customerResponse.nationality( customer.getNationality() );
        customerResponse.createdAt( customer.getCreatedAt() );

        return customerResponse.build();
    }

    @Override
    public void updateCustomerFromDto(CustomerCreateDTO dto, Customer customer) {
        if ( dto == null ) {
            return;
        }

        customer.setFullName( dto.getFullName() );
        customer.setEmail( dto.getEmail() );
        customer.setPhone( dto.getPhone() );
        customer.setIdType( dto.getIdType() );
        customer.setIdNumberCard( dto.getIdNumberCard() );
        customer.setNationality( dto.getNationality() );
    }

    @Override
    public List<CustomerResponse> toResponseList(List<Customer> customers) {
        if ( customers == null ) {
            return null;
        }

        List<CustomerResponse> list = new ArrayList<CustomerResponse>( customers.size() );
        for ( Customer customer : customers ) {
            list.add( toResponse( customer ) );
        }

        return list;
    }
}

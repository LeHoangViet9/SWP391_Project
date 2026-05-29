package com.hms.service.customer;

import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.entity.customer.Customer;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerCreateDTO customer);
    CustomerResponse updateCustomer(Long id,CustomerCreateDTO dto);
    void deleteCustomer(Long id);
    List<CustomerResponse> getCustomers();
    CustomerResponse findById(Long id);
}

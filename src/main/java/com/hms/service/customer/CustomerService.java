package com.hms.service.customer;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.entity.customer.Customer;
import org.springframework.data.domain.Page;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerCreateDTO customer);
    CustomerResponse updateCustomer(Long id,CustomerCreateDTO dto);
    void deleteCustomer(Long id);
    Page<CustomerResponse> getCustomers(
           String keyword,
            AccountStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction);
    CustomerResponse findById(Long id);
    void restoreCustomer(Long id);
    void forceDeleteCustomer(Long id);
}

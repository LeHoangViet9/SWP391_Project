package com.hms.service.customer;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.request.CustomerUpdateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.entity.customer.Customer;
import org.springframework.data.domain.Page;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerCreateDTO customer);
    CustomerResponse updateCustomer(Long id, CustomerUpdateDTO dto);
    void deleteCustomer(Long id);
    Page<CustomerResponse> getCustomers(String keywords, AccountStatus status,
                                         Integer page,
                                        Integer size,
                                        SortField sortBy,
                                        SortDirection direction);
    CustomerResponse findById(Long id);
}

package com.hms.repository.customer;

import com.hms.entity.customer.Customer;
import com.hms.common.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByIdNumberCard(String idCard);


    List<Customer> findByStatus(AccountStatus status);
}

package com.hms.repository.customer;

import com.hms.entity.customer.Customer;
import com.hms.common.enums.AccountStatus;
import io.micrometer.observation.ObservationFilter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByIdNumberCard(String idCard);


    List<Customer> findByStatus(AccountStatus status);

    Page<Customer> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCaseOrIdNumberCardContainingIgnoreCase(
            String fullName,
            String email,
            String phone,
            String idNumberCard,
            Pageable pageable
    );
}

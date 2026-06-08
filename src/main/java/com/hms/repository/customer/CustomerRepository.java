package com.hms.repository.customer;

import com.hms.entity.customer.Customer;
import com.hms.common.enums.AccountStatus;
import io.micrometer.observation.ObservationFilter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByIdAndStatus(Long id, AccountStatus status);

    @Query("""
SELECT c FROM Customer c
WHERE c.status = :status
AND (
    LOWER(c.email) = LOWER(:email)
    OR c.phone = :phone
)
""")
    Optional<Customer> findActiveByEmailOrPhone(
            @Param("email") String email,
            @Param("phone") String phone,
            @Param("status") AccountStatus status
    );

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByIdNumberCard(String idCard);

    @Query("""
SELECT c FROM Customer c
WHERE c.status = :status
AND (
    LOWER(c.fullName) LIKE LOWER(CONCAT('%', :keywords, '%'))
    OR c.phone LIKE CONCAT('%', :keywords, '%')
    OR c.idNumberCard LIKE CONCAT('%', :keywords, '%')
)
""")
    Page<Customer> searchCustomer(
            @Param("keywords") String keywords,
            @Param("status") AccountStatus status,
            Pageable pageable
    );
}

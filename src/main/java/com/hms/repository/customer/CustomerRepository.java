package com.hms.repository.customer;

import com.hms.entity.customer.Customer;
import com.hms.common.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByIdAndStatus(Long id, AccountStatus status);

    Optional<Customer> findByEmailAndStatus(String email, AccountStatus status);

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
WHERE (:status IS NULL OR c.status = :status)
AND (
    CAST(:keyword AS string) IS NULL
    OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
    OR LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
    OR c.phone LIKE CONCAT('%', CAST(:keyword AS string), '%')
    OR c.idNumberCard LIKE CONCAT('%', CAST(:keyword AS string), '%')
)
""")
    Page<Customer> searchCustomer(
            @Param("keyword") String keyword,
            @Param("status") AccountStatus status,
            Pageable pageable
    );
}

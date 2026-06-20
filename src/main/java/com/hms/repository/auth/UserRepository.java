package com.hms.repository.auth;

import com.hms.common.enums.AccountStatus;
import com.hms.entity.auth.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {

    boolean existsUserByEmail(String email);

    boolean existsUserByPhone(String phone);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    Optional<User> findUserByEmail(String email);

    @Query("""
            select u from User u
            left join fetch u.role r
            left join fetch r.permissions
            where u.email = :email
            """)
    Optional<User> findUserWithPermissionsByEmail(@Param("email") String email);

    Optional<User> findByResetPasswordToken(String resetPasswordToken);

    @Query("""
            select u from User u
            where (:status is null or u.accountStatus = :status)
              and (:id is null or u.id = :id)
              and (:roleName is null or lower(u.role.roleName) = lower(:roleName))
              and (:fullName is null or :fullName = '' or lower(u.fullName) like lower(concat('%', :fullName, '%')))
              and (:email is null or :email = '' or lower(u.email) like lower(concat('%', :email, '%')))
              and (:phone is null or :phone = '' or lower(u.phone) like lower(concat('%', :phone, '%')))
            """)
    Page<User> searchUsers(
            @Param("id") Long id,
            @Param("fullName") String fullName,
            @Param("email") String email,
            @Param("phone") String phone,
            @Param("status") AccountStatus status,
            @Param("roleName") String roleName,
            Pageable pageable
    );
}

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

    @Query("SELECT u FROM User u WHERE " +
            "(:id IS NULL OR u.id = :id) AND " +
            "(:fullName IS NULL OR :fullName = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :fullName, '%'))) AND " +
            "(:email IS NULL OR :email = '' OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
            "(:phone IS NULL OR :phone = '' OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :phone, '%'))) AND " +
            "(:roleName IS NULL OR :roleName = '' OR LOWER(u.role.roleName) LIKE LOWER(CONCAT('%', :roleName, '%'))) AND " +
            "(:status IS NULL OR u.accountStatus = :status)")
    Page<User> searchUsers(
            @Param("id") Long id,
            @Param("fullName") String fullName,
            @Param("email") String email,
            @Param("phone") String phone,
            @Param("roleName") String roleName,
            @Param("status") AccountStatus status,
            Pageable pageable);
}

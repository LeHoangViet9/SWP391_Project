package com.hms.repository.auth;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.StaffWorkStatus;
import com.hms.entity.auth.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    List<User> findByRole_RoleNameIgnoreCaseAndAccountStatus(String roleName, AccountStatus accountStatus);

    List<User> findByRole_RoleNameIgnoreCaseAndAccountStatusAndWorkStatus(
            String roleName,
            AccountStatus accountStatus,
            StaffWorkStatus workStatus);

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

    /**
     * Tìm kiếm nhân viên (loại trừ CUSTOMER khỏi danh sách).
     * Dùng cho trang quản lý nhân viên — Khách hàng được quản lý riêng ở phân hệ Customer.
     */
    @Query("SELECT u FROM User u WHERE " +
            "UPPER(u.role.roleName) <> 'CUSTOMER' AND " +
            "(:id IS NULL OR u.id = :id) AND " +
            "(:fullName IS NULL OR :fullName = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :fullName, '%'))) AND " +
            "(:email IS NULL OR :email = '' OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
            "(:phone IS NULL OR :phone = '' OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :phone, '%'))) AND " +
            "(:roleName IS NULL OR :roleName = '' OR LOWER(u.role.roleName) LIKE LOWER(CONCAT('%', :roleName, '%'))) AND " +
            "(:status IS NULL OR u.accountStatus = :status)")
    Page<User> searchEmployees(
            @Param("id") Long id,
            @Param("fullName") String fullName,
            @Param("email") String email,
            @Param("phone") String phone,
            @Param("roleName") String roleName,
            @Param("status") AccountStatus status,
            Pageable pageable);

    /**
     * Tìm housekeeper ACTIVE có ít task PENDING/IN_PROGRESS nhất (round-robin by workload).
     * Dùng cho auto-assign task khi checkout.
     */
    @Query("""
            SELECT u FROM User u
            LEFT JOIN HouseKeepingTask t ON t.assignedTo.id = u.id
                AND t.taskStatus IN ('PENDING', 'IN_PROGRESS')
            WHERE UPPER(u.role.roleName) = 'HOUSEKEEPER'
                AND u.accountStatus = com.hms.common.enums.AccountStatus.ACTIVE
                AND u.workStatus = com.hms.common.enums.StaffWorkStatus.AVAILABLE
                AND (:excludedUserId IS NULL OR u.id <> :excludedUserId)
            GROUP BY u
            ORDER BY COUNT(t) ASC
            """)
    List<User> findHousekeepersOrderByTaskCountAscExcluding(@Param("excludedUserId") Long excludedUserId);

    @Query("""
            SELECT u FROM User u
            LEFT JOIN HouseKeepingTask t ON t.assignedTo.id = u.id
                AND t.taskStatus IN ('PENDING', 'IN_PROGRESS')
            WHERE UPPER(u.role.roleName) = 'HOUSEKEEPER'
                AND u.accountStatus = com.hms.common.enums.AccountStatus.ACTIVE
                AND u.workStatus = com.hms.common.enums.StaffWorkStatus.AVAILABLE
            GROUP BY u
            ORDER BY COUNT(t) ASC
            """)
    List<User> findHousekeepersOrderByTaskCountAsc();
}

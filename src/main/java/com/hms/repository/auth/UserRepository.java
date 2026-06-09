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

    boolean existsUserByUserName(String userName);

    boolean existsUserByEmail(String email);

    boolean existsUserByPhone(String phone);

    boolean existsByUserNameAndIdNot(String userName, Long id);

    boolean existsByEmailAndIdNot(String email, Long id);

    boolean existsByPhoneAndIdNot(String phone, Long id);

    java.util.Optional<User> findUserByUserName(String userName);

    Optional<User> findUserByEmail(String email);

    Optional<User> findByResetPasswordToken(String resetPasswordToken);

    @Query("""
            select u from User u
            where (:status is null or u.accountStatus = :status)
              and (
                :keywords = ''
                or lower(u.fullName) like lower(concat('%', :keywords, '%'))
                or lower(u.userName) like lower(concat('%', :keywords, '%'))
                or lower(u.email) like lower(concat('%', :keywords, '%'))
                or lower(u.phone) like lower(concat('%', :keywords, '%'))
              )
            """)
    Page<User> searchUsers(
            @Param("keywords") String keywords,
            @Param("status") AccountStatus status,
            Pageable pageable
    );
}

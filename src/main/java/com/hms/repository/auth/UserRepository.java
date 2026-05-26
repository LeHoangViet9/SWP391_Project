package com.hms.repository.auth;

import com.hms.entity.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;



public interface UserRepository extends JpaRepository<User,Long> {

    boolean existsUserByUserName(String userName);

    boolean existsUserByEmail(String email);

    boolean existsUserByPhone(String phone);

    java.util.Optional<User> findUserByUserName(String userName);
}

package com.hms.common.config;

import com.hms.common.enums.AccountStatus;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import com.hms.repository.auth.RoleRepository;
import com.hms.repository.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tạo tài khoản test khi khởi động (chỉ nếu username chưa tồn tại).
 * Mật khẩu được BCrypt hash — KHÔNG thể giải mã ngược từ DB.
 * Xem mật khẩu gốc trong log startup hoặc file TEST_ACCOUNTS.md.
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class UserDataInitializer implements ApplicationRunner {

    private record TestUser(
            String userName,
            String fullName,
            String email,
            String phone,
            String plainPassword,
            String roleName
    ) {}

    private static final TestUser[] TEST_USERS = {
            new TestUser("admin",        "Admin Test",        "admin@test.hms",        "0900000001", "Admin@123",       "ADMIN"),
            new TestUser("manager",      "Manager Test",      "manager@test.hms",      "0900000002", "Manager@123",     "MANAGER"),
            new TestUser("receptionist", "Receptionist Test", "receptionist@test.hms", "0900000003", "Reception@123",   "RECEPTIONIST"),
            new TestUser("maintenance",  "Maintenance Test",  "maintenance@test.hms",  "0900000004", "Maint@123",       "MAINTENANCE"),
            new TestUser("housekeeper",  "Housekeeper Test",  "housekeeper@test.hms",  "0900000005", "House@123",       "HOUSEKEEPER"),
            new TestUser("customer",     "Customer Test",     "customer@test.hms",     "0900000006", "Customer@123",    "CUSTOMER"),
    };

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("========== HMS TEST ACCOUNTS (plain passwords) ==========");
        for (TestUser tu : TEST_USERS) {
            if (userRepository.existsUserByUserName(tu.userName())) {
                log.info("  [skip] {} — already exists", tu.userName());
                continue;
            }

            Role role = roleRepository.findByRoleNameIgnoreCase(tu.roleName())
                    .orElseThrow(() -> new IllegalStateException(
                            "Role not found: " + tu.roleName() + ". Run RoleDataInitializer first."));

            User user = User.builder()
                    .userName(tu.userName())
                    .fullName(tu.fullName())
                    .email(tu.email())
                    .phone(tu.phone())
                    .password(passwordEncoder.encode(tu.plainPassword()))
                    .accountStatus(AccountStatus.ACTIVE)
                    .role(role)
                    .build();

            userRepository.save(user);
            log.info("  [created] username={} | password={} | role={}",
                    tu.userName(), tu.plainPassword(), tu.roleName());
        }
        log.info("=========================================================");
        log.info("BCrypt hash trong DB KHÔNG đọc ngược được — dùng mật khẩu ở trên để đăng nhập.");
    }
}

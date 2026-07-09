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
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Tạo tài khoản test khi khởi động (chỉ nếu email chưa tồn tại).
 * Mật khẩu được BCrypt hash — KHÔNG thể giải mã ngược từ DB.
 * Xem mật khẩu gốc trong log startup hoặc file TEST_ACCOUNTS.md.
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class UserDataInitializer implements ApplicationRunner {

    private record TestUser(
            String fullName,
            String email,
            String phone,
            String plainPassword,
            String roleName
    ) {}

    private static final TestUser[] TEST_USERS = {
            new TestUser("Admin Test",        "admin@test.hms",        "0900000001", "Admin@123",       "ADMIN"),
            new TestUser("Manager Test",      "manager@test.hms",      "0900000002", "Manager@123",     "MANAGER"),
            new TestUser("Receptionist Test", "receptionist@test.hms", "0900000003", "Reception@123",   "RECEPTIONIST"),
            new TestUser("Maintenance Test",  "maintenance@test.hms",  "0900000004", "Maint@123",       "MAINTENANCE"),
            new TestUser("Housekeeper Test",  "housekeeper@test.hms",  "0900000005", "House@123",       "HOUSEKEEPER"),
            new TestUser("Customer Test",     "customer@test.hms",     "0900000006", "Customer@123",    "CUSTOMER"),
    };

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            log.info("========== Updating room_state_history check constraints ==========");
            jdbcTemplate.execute("ALTER TABLE room_state_history DROP CONSTRAINT IF EXISTS room_state_history_triggered_by_process_check");
            
            // Clean up any historical rows violating the check constraint by setting them to a valid fallback
            jdbcTemplate.execute("UPDATE room_state_history SET triggered_by_process = 'CHECKIN' " +
                    "WHERE triggered_by_process NOT IN ('TASK_CLEANING', 'TASK_IN_PROGRESS', 'TASK_COMPLETION', " +
                    "'TASK_CANCELLATION', 'TASK_SKIPPED', 'TASK_MAINTENANCE', 'CHECKIN', 'CHECKOUT')");

            jdbcTemplate.execute("ALTER TABLE room_state_history ADD CONSTRAINT room_state_history_triggered_by_process_check " +
                    "CHECK (triggered_by_process IN ('TASK_CLEANING', 'TASK_IN_PROGRESS', 'TASK_COMPLETION', " +
                    "'TASK_CANCELLATION', 'TASK_SKIPPED', 'TASK_MAINTENANCE', 'CHECKIN', 'CHECKOUT'))");
            log.info("Successfully updated room_state_history check constraints!");
        } catch (Exception e) {
            log.error("Failed to update check constraints: ", e);
        }

        log.info("========== HMS TEST ACCOUNTS (plain passwords) ==========");
        for (TestUser tu : TEST_USERS) {
            if (userRepository.existsUserByEmail(tu.email())) {
                log.info("  [skip] {} — already exists", tu.email());
                continue;
            }

            Role role = roleRepository.findByRoleNameIgnoreCase(tu.roleName())
                    .orElseThrow(() -> new IllegalStateException(
                            "Role not found: " + tu.roleName() + ". Run RoleDataInitializer first."));

            User user = User.builder()
                    .fullName(tu.fullName())
                    .email(tu.email())
                    .phone(tu.phone())
                    .password(passwordEncoder.encode(tu.plainPassword()))
                    .accountStatus(AccountStatus.ACTIVE)
                    .enabled(true)
                    .role(role)
                    .build();

            userRepository.save(user);
            log.info("  [created] email={} | password={} | role={}",
                    tu.email(), tu.plainPassword(), tu.roleName());
        }
        log.info("=========================================================");
        log.info("BCrypt hash trong DB KHÔNG đọc ngược được — dùng mật khẩu ở trên để đăng nhập.");
    }
}

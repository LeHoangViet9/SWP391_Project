package com.hms.common.config;

import com.hms.entity.auth.Role;
import com.hms.repository.auth.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class RoleDataInitializer implements ApplicationRunner {

    /**
     * Khớp với các role trong hệ thống:
     * admin, manager, customer, receptionist, maintenance, housekeeper
     */
    private static final List<String> DEFAULT_ROLES = List.of(
            "ADMIN",
            "MANAGER",
            "CUSTOMER",
            "RECEPTIONIST",
            "MAINTENANCE",
            "HOUSEKEEPER"
    );

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (String roleName : DEFAULT_ROLES) {
            roleRepository.findByRoleNameIgnoreCase(roleName).orElseGet(() -> {
                Role role = Role.builder()
                        .roleName(roleName)
                        .permissions("[]")
                        .build();
                Role saved = roleRepository.save(role);
                log.info("Seeded role: {}", roleName);
                return saved;
            });
        }
    }
}

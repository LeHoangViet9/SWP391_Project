package com.hms.common.config;

import com.hms.entity.auth.Permission;
import com.hms.entity.auth.Role;
import com.hms.repository.auth.PermissionRepository;
import com.hms.repository.auth.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@Order(2) // Chạy sau RoleDataInitializer
@RequiredArgsConstructor
@Slf4j
public class PermissionDataInitializer implements ApplicationRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // 1. Tạo tất cả permissions
        List<String> allPermissions = Arrays.asList(
                // User permissions
                "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE",

                // Room permissions
                "ROOM_VIEW", "ROOM_CREATE", "ROOM_UPDATE", "ROOM_DELETE",

                // Room Type permissions
                "ROOM_TYPE_VIEW", "ROOM_TYPE_CREATE", "ROOM_TYPE_UPDATE", "ROOM_TYPE_DELETE",

                // Customer permissions
                "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_UPDATE", "CUSTOMER_DELETE",

                // Booking permissions
                "BOOKING_VIEW", "BOOKING_CREATE", "BOOKING_UPDATE", "BOOKING_DELETE", "BOOKING_VIEW_OWN",

                // Housekeeping permissions
                "HOUSEKEEPING_VIEW", "HOUSEKEEPING_CREATE", "HOUSEKEEPING_UPDATE", "HOUSEKEEPING_DELETE",

                // Equipment permissions
                "EQUIPMENT_VIEW", "EQUIPMENT_CREATE", "EQUIPMENT_UPDATE", "EQUIPMENT_DELETE",

                // Maintenance permissions
                "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE", "MAINTENANCE_DELETE",

                // Feedback permissions
                "FEEDBACK_VIEW", "FEEDBACK_CREATE", "FEEDBACK_UPDATE", "FEEDBACK_DELETE",

                // Invoice permissions
                "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_DELETE"
        );

        for (String permName : allPermissions) {
            permissionRepository.findByName(permName).orElseGet(() -> {
                Permission perm = Permission.builder().name(permName).build();
                Permission saved = permissionRepository.save(perm);
                log.info("Created permission: {}", permName);
                return saved;
            });
        }

        // 2. Gán permissions cho từng role
        assignPermissionsToAdmin();
        assignPermissionsToManager();
        assignPermissionsToReceptionist();
        assignPermissionsToHousekeeper();
        assignPermissionsToMaintenance();
        assignPermissionsToCustomer();

        log.info("All permissions have been assigned to roles.");
    }

    private void assignPermissionsToAdmin() {
        Role admin = roleRepository.findByRoleNameIgnoreCase("ADMIN").orElse(null);
        if (admin == null || !admin.getPermissions().isEmpty()) return;

        // ADMIN có tất cả quyền
        List<Permission> allPerms = permissionRepository.findAll();
        admin.setPermissions(allPerms);
        roleRepository.save(admin);
        log.info("Assigned ALL permissions to ADMIN");
    }

    private void assignPermissionsToManager() {
        Role manager = roleRepository.findByRoleNameIgnoreCase("MANAGER").orElse(null);
        if (manager == null || !manager.getPermissions().isEmpty()) return;

        List<String> managerPerms = Arrays.asList(
                "USER_VIEW",
                "ROOM_VIEW", "ROOM_CREATE", "ROOM_UPDATE", "ROOM_DELETE",
                "ROOM_TYPE_VIEW", "ROOM_TYPE_CREATE", "ROOM_TYPE_UPDATE", "ROOM_TYPE_DELETE",
                "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_UPDATE", "CUSTOMER_DELETE",
                "BOOKING_VIEW", "BOOKING_CREATE", "BOOKING_UPDATE", "BOOKING_DELETE",
                "HOUSEKEEPING_VIEW", "HOUSEKEEPING_CREATE", "HOUSEKEEPING_UPDATE", "HOUSEKEEPING_DELETE",
                "EQUIPMENT_VIEW", "EQUIPMENT_CREATE", "EQUIPMENT_UPDATE", "EQUIPMENT_DELETE",
                "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE", "MAINTENANCE_DELETE",
                "FEEDBACK_VIEW", "FEEDBACK_CREATE", "FEEDBACK_UPDATE", "FEEDBACK_DELETE",
                "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_DELETE"
        );

        List<Permission> permissions = new ArrayList<>();
        for (String permName : managerPerms) {
            permissionRepository.findByName(permName).ifPresent(permissions::add);
        }
        manager.setPermissions(permissions);
        roleRepository.save(manager);
        log.info("Assigned {} permissions to MANAGER", permissions.size());
    }

    private void assignPermissionsToReceptionist() {
        Role receptionist = roleRepository.findByRoleNameIgnoreCase("RECEPTIONIST").orElse(null);
        if (receptionist == null || !receptionist.getPermissions().isEmpty()) return;

        List<String> receptionistPerms = Arrays.asList(
                "ROOM_VIEW",
                "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_UPDATE",
                "BOOKING_VIEW", "BOOKING_CREATE", "BOOKING_UPDATE",
                "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE",
                "FEEDBACK_VIEW", "FEEDBACK_CREATE"
        );

        List<Permission> permissions = new ArrayList<>();
        for (String permName : receptionistPerms) {
            permissionRepository.findByName(permName).ifPresent(permissions::add);
        }
        receptionist.setPermissions(permissions);
        roleRepository.save(receptionist);
        log.info("Assigned {} permissions to RECEPTIONIST", permissions.size());
    }

    private void assignPermissionsToHousekeeper() {
        Role housekeeper = roleRepository.findByRoleNameIgnoreCase("HOUSEKEEPER").orElse(null);
        if (housekeeper == null || !housekeeper.getPermissions().isEmpty()) return;

        List<String> housekeeperPerms = Arrays.asList(
                "HOUSEKEEPING_VIEW", "HOUSEKEEPING_UPDATE",
                "MAINTENANCE_VIEW"
        );

        List<Permission> permissions = new ArrayList<>();
        for (String permName : housekeeperPerms) {
            permissionRepository.findByName(permName).ifPresent(permissions::add);
        }
        housekeeper.setPermissions(permissions);
        roleRepository.save(housekeeper);
        log.info("Assigned {} permissions to HOUSEKEEPER", permissions.size());
    }

    private void assignPermissionsToMaintenance() {
        Role maintenance = roleRepository.findByRoleNameIgnoreCase("MAINTENANCE").orElse(null);
        if (maintenance == null || !maintenance.getPermissions().isEmpty()) return;

        List<String> maintenancePerms = Arrays.asList(
                "EQUIPMENT_VIEW", "EQUIPMENT_CREATE", "EQUIPMENT_UPDATE", "EQUIPMENT_DELETE",
                "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE", "MAINTENANCE_DELETE"
        );

        List<Permission> permissions = new ArrayList<>();
        for (String permName : maintenancePerms) {
            permissionRepository.findByName(permName).ifPresent(permissions::add);
        }
        maintenance.setPermissions(permissions);
        roleRepository.save(maintenance);
        log.info("Assigned {} permissions to MAINTENANCE", permissions.size());
    }

    private void assignPermissionsToCustomer() {
        Role customer = roleRepository.findByRoleNameIgnoreCase("CUSTOMER").orElse(null);
        if (customer == null || !customer.getPermissions().isEmpty()) return;

        List<String> customerPerms = Arrays.asList(
                "BOOKING_VIEW_OWN", "BOOKING_CREATE",
                "CUSTOMER_VIEW"
        );

        List<Permission> permissions = new ArrayList<>();
        for (String permName : customerPerms) {
            permissionRepository.findByName(permName).ifPresent(permissions::add);
        }
        customer.setPermissions(permissions);
        roleRepository.save(customer);
        log.info("Assigned {} permissions to CUSTOMER", permissions.size());
    }
}
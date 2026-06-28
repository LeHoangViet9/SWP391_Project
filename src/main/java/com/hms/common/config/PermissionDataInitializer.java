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

import java.util.Arrays;
import java.util.HashSet; // THÊM IMPORT NÀY
import java.util.List;
import java.util.Set;     // THÊM IMPORT NÀY

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

                // Check-in permissions
                "CHECKIN_VIEW", "CHECKIN_PROCESS",

                // Housekeeping permissions
                "HOUSEKEEPING_VIEW", "HOUSEKEEPING_CREATE", "HOUSEKEEPING_UPDATE", "HOUSEKEEPING_DELETE",

                // Equipment permissions
                "EQUIPMENT_VIEW", "EQUIPMENT_CREATE", "EQUIPMENT_UPDATE", "EQUIPMENT_DELETE",

                // Maintenance permissions
                "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE", "MAINTENANCE_DELETE",

                // Feedback permissions
                "FEEDBACK_VIEW", "FEEDBACK_CREATE", "FEEDBACK_UPDATE", "FEEDBACK_DELETE",

                // Invoice permissions
                "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_DELETE",

                // System/UI permissions
                "DASHBOARD_VIEW",

                // Audit log permissions
                "AUDIT_LOG_VIEW"
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
        List<String> adminPerms = Arrays.asList(
                "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_DELETE",
                "ROOM_VIEW", "ROOM_CREATE", "ROOM_UPDATE", "ROOM_DELETE",
                "ROOM_TYPE_VIEW", "ROOM_TYPE_CREATE", "ROOM_TYPE_UPDATE", "ROOM_TYPE_DELETE",
                "DASHBOARD_VIEW",
                "AUDIT_LOG_VIEW"
        );
        syncRolePermissions("ADMIN", adminPerms);
    }

    private void syncRolePermissions(String roleName, List<String> requiredPermNames) {
        Role role = roleRepository.findByRoleNameIgnoreCase(roleName).orElse(null);
        if (role == null) return;

        Set<Permission> targetPerms = new HashSet<>();
        for (String permName : requiredPermNames) {
            Permission perm = permissionRepository.findByName(permName).orElse(null);
            if (perm != null) {
                targetPerms.add(perm);
            }
        }

        role.setPermissions(targetPerms);
        roleRepository.save(role);
        log.info("Synchronized permissions for role: {}", roleName);
    }

    private void assignPermissionsToManager() {
        List<String> managerPerms = Arrays.asList(
                "DASHBOARD_VIEW",
                "ROOM_VIEW", "ROOM_UPDATE",
                "ROOM_TYPE_VIEW",
                "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_UPDATE", "CUSTOMER_DELETE",
                "BOOKING_VIEW", "BOOKING_CREATE", "BOOKING_UPDATE", "BOOKING_DELETE",
                "CHECKIN_VIEW", "CHECKIN_PROCESS",
                "HOUSEKEEPING_VIEW", "HOUSEKEEPING_CREATE", "HOUSEKEEPING_UPDATE", "HOUSEKEEPING_DELETE",
                "EQUIPMENT_VIEW", "EQUIPMENT_CREATE", "EQUIPMENT_UPDATE", "EQUIPMENT_DELETE",
                "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE", "MAINTENANCE_DELETE",
                "FEEDBACK_VIEW", "FEEDBACK_UPDATE", "FEEDBACK_DELETE",
                "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE", "INVOICE_DELETE",
                "AUDIT_LOG_VIEW"
        );
        syncRolePermissions("MANAGER", managerPerms);
    }

    private void assignPermissionsToReceptionist() {
        List<String> receptionistPerms = Arrays.asList(
                "ROOM_VIEW",
                "ROOM_TYPE_VIEW",
                "CUSTOMER_VIEW", "CUSTOMER_CREATE", "CUSTOMER_UPDATE",
                "BOOKING_VIEW", "BOOKING_CREATE", "BOOKING_UPDATE",
                "CHECKIN_VIEW", "CHECKIN_PROCESS",
                "HOUSEKEEPING_VIEW",
                "FEEDBACK_VIEW",
                "INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_UPDATE"
        );
        syncRolePermissions("RECEPTIONIST", receptionistPerms);
    }

    private void assignPermissionsToHousekeeper() {
        List<String> housekeeperPerms = Arrays.asList(
                "ROOM_VIEW",
                "HOUSEKEEPING_VIEW", "HOUSEKEEPING_CREATE", "HOUSEKEEPING_UPDATE",
                "EQUIPMENT_VIEW",
                "MAINTENANCE_CREATE"
        );
        syncRolePermissions("HOUSEKEEPER", housekeeperPerms);
    }

    private void assignPermissionsToMaintenance() {
        List<String> maintenancePerms = Arrays.asList(
                "ROOM_VIEW",
                "EQUIPMENT_VIEW", "EQUIPMENT_CREATE", "EQUIPMENT_UPDATE",
                "MAINTENANCE_VIEW", "MAINTENANCE_CREATE", "MAINTENANCE_UPDATE"
        );
        syncRolePermissions("MAINTENANCE", maintenancePerms);
    }

    private void assignPermissionsToCustomer() {
        List<String> customerPerms = Arrays.asList(
                "BOOKING_VIEW_OWN", "BOOKING_CREATE",
                "FEEDBACK_CREATE"
        );
        syncRolePermissions("CUSTOMER", customerPerms);
    }
}

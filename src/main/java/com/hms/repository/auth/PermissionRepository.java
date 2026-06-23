package com.hms.repository.auth;

import com.hms.entity.auth.Permission;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    boolean existsByName( String name);
    Optional<Permission> findByName(String name);
    List<Permission> findAllById( Long permissionIds);
}

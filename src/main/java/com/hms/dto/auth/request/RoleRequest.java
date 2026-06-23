package com.hms.dto.auth.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@Builder
@NoArgsConstructor
public class RoleRequest {
    @NotBlank(message = "{role.name.notblank}")
    private String roleName;
    @NotNull(message = "{role.permissions.notnull}")
    private List<Long> permissionIds;
}

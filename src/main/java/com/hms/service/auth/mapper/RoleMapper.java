package com.hms.service.auth.mapper;

import com.hms.dto.auth.response.RoleResponse;
import com.hms.entity.auth.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {PermissionMapper.class})
public interface RoleMapper {
    @Mapping(source = "permissions", target = "permissions")
    RoleResponse toResponse(Role role);
}

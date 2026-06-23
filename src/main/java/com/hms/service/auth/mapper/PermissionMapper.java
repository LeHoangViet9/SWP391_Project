package com.hms.service.auth.mapper;

import com.hms.dto.auth.response.PermissionResponse;
import com.hms.entity.auth.Permission;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    PermissionResponse toResponse(Permission permission);
}

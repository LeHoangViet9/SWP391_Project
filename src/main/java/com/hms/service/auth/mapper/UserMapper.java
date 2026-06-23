package com.hms.service.auth.mapper;


import com.hms.dto.auth.request.UserRegisterRequest;
import com.hms.dto.auth.response.UserResponse;
import com.hms.entity.auth.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "accountStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "bannedReason", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "role", ignore = true)
    User toEntityRegister(UserRegisterRequest userRegisterRequest);

    @Mapping(source = "user.role.roleName", target = "roleName")
    @Mapping(source = "token", target = "token")
    @Mapping(target = "permissions", expression = "java(java.util.stream.Stream.concat(user.getCustomPermissions().stream(), user.getRole() != null && user.getRole().getPermissions() != null ? user.getRole().getPermissions().stream() : java.util.stream.Stream.empty()).map(p -> p.getName()).distinct().collect(java.util.stream.Collectors.toList()))")
    UserResponse toResponse(User user, String token);
}

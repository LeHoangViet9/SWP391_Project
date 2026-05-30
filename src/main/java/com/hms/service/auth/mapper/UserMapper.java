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
    @Mapping(source = "user.userName", target = "username")
    @Mapping(source = "token", target = "token")
    UserResponse toResponse(User user, String token);

}

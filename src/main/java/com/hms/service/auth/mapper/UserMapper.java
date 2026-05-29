package com.hms.service.auth.mapper;


import com.hms.dto.auth.request.UserRegisterRequest;
import com.hms.dto.auth.response.UserResponse;
import com.hms.entity.auth.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toEntityRegister(UserRegisterRequest userRegisterRequest);
    @Mapping(source = "role.roleName", target = "roleName")
    @Mapping(source = "userName", target = "username")
    UserResponse toResponse(User user);

}

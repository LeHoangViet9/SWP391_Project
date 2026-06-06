package com.hms.service.auth.mapper;

import com.hms.dto.auth.request.UserRegisterRequest;
import com.hms.dto.auth.response.UserResponse;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-04T14:35:36+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toEntityRegister(UserRegisterRequest userRegisterRequest) {
        if ( userRegisterRequest == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.userName( userRegisterRequest.getUserName() );
        user.fullName( userRegisterRequest.getFullName() );
        user.email( userRegisterRequest.getEmail() );
        user.phone( userRegisterRequest.getPhone() );
        user.password( userRegisterRequest.getPassword() );

        return user.build();
    }

    @Override
    public UserResponse toResponse(User user, String token) {
        if ( user == null && token == null ) {
            return null;
        }

        UserResponse userResponse = new UserResponse();

        if ( user != null ) {
            userResponse.setRoleName( userRoleRoleName( user ) );
            userResponse.setUsername( user.getUserName() );
            userResponse.setId( user.getId() );
            userResponse.setFullName( user.getFullName() );
            userResponse.setEmail( user.getEmail() );
            userResponse.setPhone( user.getPhone() );
            if ( user.getAccountStatus() != null ) {
                userResponse.setAccountStatus( user.getAccountStatus().name() );
            }
            userResponse.setLastLoginAt( user.getLastLoginAt() );
        }
        userResponse.setToken( token );

        return userResponse;
    }

    private String userRoleRoleName(User user) {
        if ( user == null ) {
            return null;
        }
        Role role = user.getRole();
        if ( role == null ) {
            return null;
        }
        String roleName = role.getRoleName();
        if ( roleName == null ) {
            return null;
        }
        return roleName;
    }
}

package com.hms.service.auth.mapper;

import com.hms.dto.auth.request.UserRegisterRequest;
import com.hms.dto.auth.response.UserResponse;
import com.hms.entity.auth.Role;
import com.hms.entity.auth.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-10T00:21:53+0700",
    comments = "version: 1.5.5.Final, compiler: IncrementalProcessingEnvironment from gradle-language-java-9.4.1.jar, environment: Java 21.0.11 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toEntityRegister(UserRegisterRequest userRegisterRequest) {
        if ( userRegisterRequest == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

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
        userResponse.setPermissions( java.util.stream.Stream.concat(user.getCustomPermissions().stream(), user.getRole() != null && user.getRole().getPermissions() != null ? user.getRole().getPermissions().stream() : java.util.stream.Stream.empty()).map(p -> p.getName()).distinct().collect(java.util.stream.Collectors.toList()) );

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

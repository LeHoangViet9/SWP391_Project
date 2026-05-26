package com.hms.service.auth;

import com.hms.dto.register.UserLoginRequest;
import com.hms.dto.register.UserRegisterRequest;
import com.hms.dto.response.UserResponse;

public interface IUserService {
    UserResponse registerNewUser(UserRegisterRequest registerRequest);
    UserResponse login(UserLoginRequest loginRequest);
}

package com.hms.service.auth;

import com.hms.dto.auth.request.UserLoginRequest;
import com.hms.dto.auth.request.UserRegisterRequest;
import com.hms.dto.auth.response.UserResponse;

public interface IUserService {
    UserResponse registerNewUser(UserRegisterRequest registerRequest);
    UserResponse login(UserLoginRequest loginRequest);
}

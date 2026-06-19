package com.hms.common.config;

import org.springframework.context.annotation.Configuration;

/**
 * Method security (@EnableMethodSecurity) đã được khai báo trong SecurityConfig
 * cùng với MethodSecurityExpressionHandler dùng CustomPermissionEvaluator.
 * Giữ class này trống để tránh đăng ký method-security trùng lặp.
 */
@Configuration
public class CustomMethodSecurityConfig {
}

package com.hms.common.config;

import com.hms.common.security.CustomPermissionEvaluator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final com.hms.common.filter.ApiAuditLoggingFilter apiAuditLoggingFilter;
    private final CustomPermissionEvaluator customPermissionEvaluator;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setPermissionEvaluator(customPermissionEvaluator);
        expressionHandler.setRoleHierarchy(roleHierarchy());
        return expressionHandler;
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("""
                ROLE_ADMIN > USER_VIEW
                ROLE_ADMIN > USER_CREATE
                ROLE_ADMIN > USER_UPDATE
                ROLE_ADMIN > USER_DELETE
                ROLE_ADMIN > ROOM_VIEW
                ROLE_ADMIN > ROOM_CREATE
                ROLE_ADMIN > ROOM_UPDATE
                ROLE_ADMIN > ROOM_DELETE
                ROLE_ADMIN > ROOM_TYPE_VIEW
                ROLE_ADMIN > ROOM_TYPE_CREATE
                ROLE_ADMIN > ROOM_TYPE_UPDATE
                ROLE_ADMIN > ROOM_TYPE_DELETE
                ROLE_ADMIN > CUSTOMER_VIEW
                ROLE_ADMIN > CUSTOMER_CREATE
                ROLE_ADMIN > CUSTOMER_UPDATE
                ROLE_ADMIN > CUSTOMER_DELETE
                ROLE_ADMIN > BOOKING_VIEW
                ROLE_ADMIN > BOOKING_CREATE
                ROLE_ADMIN > BOOKING_UPDATE
                ROLE_ADMIN > BOOKING_DELETE
                ROLE_ADMIN > BOOKING_VIEW_OWN
                ROLE_ADMIN > CHECKIN_VIEW
                ROLE_ADMIN > CHECKIN_PROCESS
                ROLE_ADMIN > HOUSEKEEPING_VIEW
                ROLE_ADMIN > HOUSEKEEPING_CREATE
                ROLE_ADMIN > HOUSEKEEPING_UPDATE
                ROLE_ADMIN > HOUSEKEEPING_DELETE
                ROLE_ADMIN > EQUIPMENT_VIEW
                ROLE_ADMIN > EQUIPMENT_CREATE
                ROLE_ADMIN > EQUIPMENT_UPDATE
                ROLE_ADMIN > EQUIPMENT_DELETE
                ROLE_ADMIN > MAINTENANCE_VIEW
                ROLE_ADMIN > MAINTENANCE_CREATE
                ROLE_ADMIN > MAINTENANCE_UPDATE
                ROLE_ADMIN > MAINTENANCE_DELETE
                ROLE_ADMIN > FEEDBACK_VIEW
                ROLE_ADMIN > FEEDBACK_CREATE
                ROLE_ADMIN > FEEDBACK_UPDATE
                ROLE_ADMIN > FEEDBACK_DELETE
                ROLE_ADMIN > INVOICE_VIEW
                ROLE_ADMIN > INVOICE_CREATE
                ROLE_ADMIN > INVOICE_UPDATE
                ROLE_ADMIN > INVOICE_DELETE
                ROLE_ADMIN > DASHBOARD_VIEW
                ROLE_ADMIN > AUDIT_LOG_VIEW
                ROLE_MANAGER > DASHBOARD_VIEW
                ROLE_MANAGER > ROOM_VIEW
                ROLE_MANAGER > ROOM_UPDATE
                ROLE_MANAGER > ROOM_TYPE_VIEW
                ROLE_MANAGER > CUSTOMER_VIEW
                ROLE_MANAGER > CUSTOMER_CREATE
                ROLE_MANAGER > CUSTOMER_UPDATE
                ROLE_MANAGER > CUSTOMER_DELETE
                ROLE_MANAGER > BOOKING_VIEW
                ROLE_MANAGER > BOOKING_CREATE
                ROLE_MANAGER > BOOKING_UPDATE
                ROLE_MANAGER > BOOKING_DELETE
                ROLE_MANAGER > CHECKIN_VIEW
                ROLE_MANAGER > CHECKIN_PROCESS
                ROLE_MANAGER > HOUSEKEEPING_VIEW
                ROLE_MANAGER > HOUSEKEEPING_CREATE
                ROLE_MANAGER > HOUSEKEEPING_UPDATE
                ROLE_MANAGER > HOUSEKEEPING_DELETE
                ROLE_MANAGER > EQUIPMENT_VIEW
                ROLE_MANAGER > EQUIPMENT_CREATE
                ROLE_MANAGER > EQUIPMENT_UPDATE
                ROLE_MANAGER > EQUIPMENT_DELETE
                ROLE_MANAGER > MAINTENANCE_VIEW
                ROLE_MANAGER > MAINTENANCE_CREATE
                ROLE_MANAGER > MAINTENANCE_UPDATE
                ROLE_MANAGER > MAINTENANCE_DELETE
                ROLE_MANAGER > FEEDBACK_VIEW
                ROLE_MANAGER > FEEDBACK_UPDATE
                ROLE_MANAGER > FEEDBACK_DELETE
                ROLE_MANAGER > INVOICE_VIEW
                ROLE_MANAGER > INVOICE_CREATE
                ROLE_MANAGER > INVOICE_UPDATE
                ROLE_MANAGER > INVOICE_DELETE
                ROLE_MANAGER > AUDIT_LOG_VIEW
                ROLE_RECEPTIONIST > ROOM_VIEW
                ROLE_RECEPTIONIST > ROOM_TYPE_VIEW
                ROLE_RECEPTIONIST > CUSTOMER_VIEW
                ROLE_RECEPTIONIST > CUSTOMER_CREATE
                ROLE_RECEPTIONIST > CUSTOMER_UPDATE
                ROLE_RECEPTIONIST > BOOKING_VIEW
                ROLE_RECEPTIONIST > BOOKING_CREATE
                ROLE_RECEPTIONIST > BOOKING_UPDATE
                ROLE_RECEPTIONIST > CHECKIN_VIEW
                ROLE_RECEPTIONIST > CHECKIN_PROCESS
                ROLE_RECEPTIONIST > HOUSEKEEPING_VIEW
                ROLE_RECEPTIONIST > FEEDBACK_VIEW
                ROLE_RECEPTIONIST > INVOICE_VIEW
                ROLE_RECEPTIONIST > INVOICE_CREATE
                ROLE_RECEPTIONIST > INVOICE_UPDATE
                ROLE_HOUSEKEEPER > ROLE_HOUSEKEEPING
                ROLE_HOUSEKEEPER > ROOM_VIEW
                ROLE_HOUSEKEEPER > HOUSEKEEPING_VIEW
                ROLE_HOUSEKEEPER > HOUSEKEEPING_CREATE
                ROLE_HOUSEKEEPER > HOUSEKEEPING_UPDATE
                ROLE_HOUSEKEEPER > EQUIPMENT_VIEW
                ROLE_HOUSEKEEPER > MAINTENANCE_CREATE
                ROLE_MAINTENANCE > ROOM_VIEW
                ROLE_MAINTENANCE > EQUIPMENT_VIEW
                ROLE_MAINTENANCE > EQUIPMENT_CREATE
                ROLE_MAINTENANCE > EQUIPMENT_UPDATE
                ROLE_MAINTENANCE > MAINTENANCE_VIEW
                ROLE_MAINTENANCE > MAINTENANCE_CREATE
                ROLE_MAINTENANCE > MAINTENANCE_UPDATE
                ROLE_CUSTOMER > BOOKING_VIEW_OWN
                ROLE_CUSTOMER > BOOKING_CREATE
                ROLE_CUSTOMER > FEEDBACK_CREATE
                """);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8089",
                "http://127.0.0.1:8089"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "X-Request-Id"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 1. Tài nguyên tĩnh và luồng Auth tự do
                        .requestMatchers(
                                "/login",
                                "/register",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/uploads/**"
                        ).permitAll()

                        // 2. API Auth công khai
                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/register",
                                "/api/v1/auth/forgot-password",
                                "/api/v1/auth/reset-password",
                                "/api/v1/auth/verify-otp",
                                "/api/v1/auth/resend-otp"
                        ).permitAll()

                        // 3. Module room-types: GET công khai
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/room-types/**").permitAll()

                        // 4. Kiểm tra phòng trống — công khai (khách chưa đăng nhập cũng cần)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/check-availability").permitAll()

                        // Tất cả các request API khác yêu cầu đăng nhập (kiểm tra quyền chi tiết qua @PreAuthorize tại Controller)
                        .requestMatchers("/api/v1/**").authenticated()

                        // Tất cả các request còn lại phải đăng nhập
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(apiAuditLoggingFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}

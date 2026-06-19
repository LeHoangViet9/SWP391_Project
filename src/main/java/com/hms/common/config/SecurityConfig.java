package com.hms.common.config;

import com.hms.common.security.CustomPermissionEvaluator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomPermissionEvaluator customPermissionEvaluator;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setPermissionEvaluator(customPermissionEvaluator);
        return expressionHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
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

                        .requestMatchers("/api/v1/auth/**").authenticated()

                        // 3. Module room-types: GET công khai
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/room-types/**").permitAll()
                        .requestMatchers("/api/v1/room-types/**").hasAnyRole("ADMIN", "MANAGER")

                        // 4. Module user management - Chỉ Admin
                        .requestMatchers("/api/v1/users/**").hasRole("ADMIN")

                        // 5. Module permissions & roles - Chỉ Admin
                        .requestMatchers("/api/v1/permissions/**", "/api/v1/roles/**").hasRole("ADMIN")

                        // 6-N. Các module khác giữ nguyên...
                        .requestMatchers("/api/v1/rooms/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/customers/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/customers")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers("/api/v1/customers/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/my-history")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/bookings")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers("/api/v1/bookings/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
                        .requestMatchers("/api/v1/invoices/**", "/api/v1/payments/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
                        .requestMatchers("/api/v1/housekeeping/**")
                        .hasAnyRole("ADMIN", "MANAGER", "HOUSEKEEPER")
                        .requestMatchers("/api/v1/equipments/**", "/api/v1/equipment-checks/**")
                        .hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/maintenance-requests/**")
                        .hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE", "HOUSEKEEPER")
                        .requestMatchers("/api/v1/maintenance-requests/**")
                        .hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE")
                        .requestMatchers("/api/v1/feedbacks/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // Tất cả các request khác phải đăng nhập
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
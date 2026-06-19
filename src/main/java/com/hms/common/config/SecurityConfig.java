package com.hms.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000")); // Thêm port dev frontend thông dụng
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept-Language", "Cache-Control"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // 1 hour caching
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: Token is invalid or has expired\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"message\":\"Forbidden: You do not have permission to access this resource\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth

                        // 1. Tài nguyên tĩnh và luồng Auth tự do
                        // SỬA MỚI: thêm /uploads/** để frontend xem được ảnh upload local
                        .requestMatchers(
                                "/login",
                                "/register",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/uploads/**"
                        ).permitAll()
                        // 1. Tài nguyên tĩnh và luồng Auth tự do
                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/register",
                                "/api/v1/auth/forgot-password",
                                "/api/v1/auth/reset-password",
                                "/api/v1/auth/verify-otp",     // ← User chưa login cần xác thực OTP
                                "/api/v1/auth/resend-otp",      // ← User chưa login cần gửi lại OTP
                                "/api/v1/bookings/check-availability" // ← [FIX-04] Cho phép public check phòng trống khi đặt phòng
                        ).permitAll()

                        .requestMatchers("/api/v1/auth/**").authenticated()

                        // 2. Module room-types: GET công khai, POST/PUT/DELETE cần ADMIN hoặc MANAGER
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/room-types/**").permitAll()
                        .requestMatchers("/api/v1/room-types/**").hasAnyRole("ADMIN", "MANAGER")

                        // 3. Module room & auth_user - Chỉ Admin/Manager được CRUD, Lễ tân chỉ được Xem (Read)
                        .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/rooms/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 4. Module customer - Lễ tân và Quản lý quản lý hồ sơ khách hàng, Customer tự lookup/tạo profile của mình, staff CRUD toàn bộ
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/customers/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/customers")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers("/api/v1/customers/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 5. Module booking - Customer tự đặt phòng + xem lịch sử, Staff quản lý toàn bộ
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/my-history")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/bookings")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers("/api/v1/bookings/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 6. Module billing - Hóa đơn, thanh toán
                        .requestMatchers("/api/v1/invoices/**", "/api/v1/payments/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 7. Module housekeeping - Lao công nhận task và cập nhật trạng thái
                        .requestMatchers("/api/v1/housekeeping/**")
                        .hasAnyRole("ADMIN", "MANAGER", "HOUSEKEEPER")

                        // 8. Module equipment - Quản lý thiết bị, kiểm tra, sửa chữa
                        .requestMatchers("/api/v1/equipments/**", "/api/v1/equipment-checks/**")
                        .hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE")

                        // 9. Module maintenance requests - ADMIN, MANAGER, MAINTENANCE CRUD; HOUSEKEEPER view only
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/maintenance-requests/**")
                        .hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE", "HOUSEKEEPER")
                        .requestMatchers("/api/v1/maintenance-requests/**")
                        .hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE")

                        // Module customer_feedback: Quản lý xem, Lễ tân tiếp nhận phản hồi của khách
                        .requestMatchers("/api/v1/feedbacks/**")
                        .hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // Tất cả các request khác phải đăng nhập
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
package com.hms.common.config; // Nếu đã chuyển vào common thì đổi thành com.hms.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
<<<<<<< HEAD
                        .requestMatchers("/login", "/register", "/css/**", "/js/**", "/images/**").permitAll()
=======
                        // 1. Tài nguyên tĩnh và luồng Auth tự do
                        .requestMatchers("/login", "/register", "/css/**", "/js/**", "/images/**", "/uploads/**").permitAll()
>>>>>>> ui-react2
                        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password").permitAll()
                        .requestMatchers("/api/v1/auth/**").authenticated()

                        // 2. Module room-types: GET công khai, POST/PUT/DELETE cần ADMIN hoặc MANAGER
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/room-types/**").permitAll()
                        .requestMatchers("/api/v1/room-types/**").hasAnyRole("ADMIN", "MANAGER")

                        // 3. Module room & auth_user: Chỉ Admin/Manager được CRUD, Lễ tân chỉ được Xem (Read)
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/**")
                        .hasAnyRole("ADMIN", "MANAGER")

                        .requestMatchers("/api/v1/users/**")
                        .hasRole("ADMIN")
                        .requestMatchers("/api/v1/rooms/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 4. Module customer: Lễ tân và Quản lý quản lý hồ sơ khách hàng
                        // Customer tự lookup/tạo profile của mình, staff CRUD toàn bộ
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/customers/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/customers").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers("/api/v1/customers/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 5. Module booking: Customer tự đặt phòng + xem lịch sử, Staff quản lý toàn bộ
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/my-history").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/bookings").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST", "CUSTOMER")
                        .requestMatchers("/api/v1/bookings/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 6. Module billing: Hóa đơn, thanh toán
                        .requestMatchers("/api/v1/invoices/**", "/api/v1/payments/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")

                        // 7. Module housekeeping: Lao công nhận task và cập nhật trạng thái
                        .requestMatchers("/api/v1/housekeeping/**").hasAnyRole("ADMIN", "MANAGER", "HOUSEKEEPER")

                        // 8. Module infrastructure & equipment: Quản lý thiết bị, kiểm tra, sửa chữa
                        .requestMatchers("/api/v1/equipments/**", "/api/v1/equipment-checks/**").hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE")

                        // 9. Module maintenance-requests: ADMIN, MANAGER, MAINTENANCE CRUD; HOUSEKEEPER view only
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/maintenance-requests/**").hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE", "HOUSEKEEPER")
                        .requestMatchers("/api/v1/maintenance-requests/**").hasAnyRole("ADMIN", "MANAGER", "MAINTENANCE")

                        // Module customer_feedback: Quản lý xem, Lễ tân tiếp nhận phản hồi của khách
                        .requestMatchers("/api/v1/feedbacks/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
                        // Dashboard
                        .requestMatchers(("/api/v1/dashboards/**")).hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
                        .anyRequest().authenticated())
//                        .anyRequest().permitAll())

                ;

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

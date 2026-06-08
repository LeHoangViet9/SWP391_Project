package com.hms.common.config; // Nếu đã chuyển vào common thì đổi thành com.hms.common.config;

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
//
//                        // 1. Tài nguyên tĩnh phục vụ giao diện (ThymeLeaf WebController) và luồng Auth tự do
//                        .requestMatchers("/login", "/register", "/css/**", "/js/**", "/images/**").permitAll()
//                        .requestMatchers("/api/v1/auth/**").permitAll()
//
//                        // 2. Module room & auth_user: Chỉ Admin/Manager được CRUD, Lễ tân chỉ được Xem (Read)
//                        .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
//                        .requestMatchers("/api/v1/rooms/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
//
//                        // 3. Module customer: Lễ tân và Quản lý quản lý hồ sơ khách hàng
//                        .requestMatchers("/api/v1/customers/**").hasAnyRole("MANAGER", "RECEPTIONIST")
//
//                        // 4. Module booking_reception (Member 2): Check-in, Check-out, Gán phòng
//                        .requestMatchers("/api/v1/bookings/**").hasAnyRole("MANAGER", "RECEPTIONIST")
//
//                        // 5. Module billing: Hóa đơn, thanh toán
//                        .requestMatchers("/api/v1/invoices/**", "/api/v1/payments/**").hasAnyRole("MANAGER", "RECEPTIONIST")
//
//                        // 6. Module housekeeping: Lao công nhận task và cập nhật trạng thái
//                        .requestMatchers("/api/v1/housekeeping/**").hasAnyRole("MANAGER", "HOUSEKEEPER")
//
//                        // 7. Module infrastructure & equipment: Quản lý thiết bị, kiểm tra, sửa chữa
//                        .requestMatchers("/api/v1/equipments/**", "/api/v1/equipment-checks/**").hasAnyRole("ADMIN", "MAINTENANCE")
//
//                        // Module customer_feedback: Quản lý xem, Lễ tân tiếp nhận phản hồi của khách
//                        .requestMatchers("/api/v1/feedbacks/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTIONIST")
//
//                        // Module RoomType: Quản lý loại phòng
//                        .requestMatchers("/api/v1/room-types/**").permitAll()

                        // Tất cả các request khác ngoài các prefix trên bắt buộc phải đăng nhập thành công mới được vào

                        .anyRequest().permitAll()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
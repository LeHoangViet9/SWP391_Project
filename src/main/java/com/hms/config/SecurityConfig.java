package com.hms.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // CHÍNH LÀ ĐOẠN NÀY: Khai báo Bean mã hóa mật khẩu để sửa lỗi crash Server của bạn
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Cấu hình tạm thời để mở cửa toàn bộ API luồng Auth cho bạn dễ test dữ liệu
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**", "/login", "/register", "/css/**", "/js/**", "/images/**").permitAll() // Mở tự do cho API Auth, giao diện Login/Register và tài nguyên tĩnh
                        .anyRequest().permitAll() // Tạm thời mở hết để bạn chạy được dự án không bị chặn 403
                );

        return http.build();
    }
}

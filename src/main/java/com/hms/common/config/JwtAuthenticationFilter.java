package com.hms.common.config;

import com.hms.entity.auth.User;
import com.hms.repository.auth.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    /**
     * Phương thức thực hiện lọc mỗi request đi vào hệ thống để kiểm tra và xác thực
     * JWT.
     * Nếu token hợp lệ, nạp thông tin người dùng cùng các quyền hạn tương ứng vào
     * SecurityContextHolder.
     *
     * @param request     HttpServletRequest của người dùng gửi đến
     * @param response    HttpServletResponse phản hồi của máy chủ
     * @param filterChain Chuỗi filter tiếp theo cần xử lý request
     * @throws ServletException nếu xảy ra lỗi xử lý servlet
     * @throws IOException      nếu xảy ra lỗi vào ra dữ liệu
     */
    @Override
    // bước 1: Dòng 42-78: Chạy với MỌI request đến server

    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);// đọc token từ header

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // token tồn tại VÀ hợp lệ (chữ ký đúng, chưa hết hạn)

                Claims claims = tokenProvider.getClaims(jwt);// giải mã JWT để lấy thông tin
                String email = claims.getSubject(); // lấy email từ JWT

                // Nạp User kèm Role + Permission trong cùng một session (JOIN FETCH),
                // rồi build đầy đủ authorities (ROLE_* + các permission) vào SecurityContext.
                userRepository.findUserWithPermissionsByEmail(email).ifPresent(user -> { // tìm user trong DB
                    List<GrantedAuthority> authorities = buildAuthorities(user); // build danh sách quyền hạn

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            authorities); // tạo object xác thực, không lưu password (null), chỉ lưu email + quyền

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request));

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                });
            }
        } catch (Exception ex) {
            logger.error("Failed to authenticate JWT token", ex); // token sai → không set authentication → request tiếp
                                                                  // tục nhưng không có quyền

        }

        filterChain.doFilter(request, response); // token sai → không set authentication → request tiếp tục nhưng không
                                                 // có quyền
    }

    /**
     * Gộp vai trò và quyền hạn của User thành danh sách GrantedAuthority:
     * - ROLE_<roleName> dùng để kiểm tra vai trò bằng hasRole(...) trong Security
     * - Mỗi Permission thuộc Role và các Permission riêng của User dùng với
     * hasAuthority(...) / hasPermission(...)
     *
     * @param user đối tượng người dùng thực thể nạp từ cơ sở dữ liệu
     * @return danh sách các GrantedAuthority hợp lệ
     */
    private List<GrantedAuthority> buildAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName()));

            if (user.getRole().getPermissions() != null) {
                user.getRole().getPermissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.getName())));
            }
        }

        if (user.getCustomPermissions() != null) {
            user.getCustomPermissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.getName())));
        }

        return authorities;
    }

    /**
     * Trích xuất JWT token từ Authorization header của HTTP request.
     * Token phải có tiền tố "Bearer ".
     *
     * @param request đối tượng HTTP request từ phía client
     * @return chuỗi JWT token nếu hợp lệ, ngược lại trả về null
     */
    // bước 2: Dòng 120-124: Lấy token từ header Authorization: "Bearer <token>"
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization"); // lấy chuỗi từ header "Authorization"

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) { // kiểm tra token có tồn tại và bắt
                                                                                     // đầu bằng "Bearer "
            return bearerToken.substring(7); // cắt chuỗi để lấy token
        }
        return null; // nếu không hợp lệ thì trả về null
    }
}

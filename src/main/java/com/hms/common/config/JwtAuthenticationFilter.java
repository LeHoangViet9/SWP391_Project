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

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {

                Claims claims = tokenProvider.getClaims(jwt);
                String email = claims.getSubject();

                // Nạp User kèm Role + Permission trong cùng một session (JOIN FETCH),
                // rồi build đầy đủ authorities (ROLE_* + các permission) vào SecurityContext.
                userRepository.findUserWithPermissionsByEmail(email).ifPresent(user -> {
                    List<GrantedAuthority> authorities = buildAuthorities(user);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    authorities
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                });
            }
        } catch (Exception ex) {
            logger.error("Failed to authenticate JWT token", ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Gộp quyền của User thành danh sách GrantedAuthority:
     * - ROLE_<roleName> để dùng với hasRole(...)
     * - Mỗi Permission của Role và Permission riêng của User -> hasAuthority(...) / hasPermission(...)
     */
    private List<GrantedAuthority> buildAuthorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName()));

            if (user.getRole().getPermissions() != null) {
                user.getRole().getPermissions().forEach(p ->
                        authorities.add(new SimpleGrantedAuthority(p.getName())));
            }
        }

        if (user.getCustomPermissions() != null) {
            user.getCustomPermissions().forEach(p ->
                    authorities.add(new SimpleGrantedAuthority(p.getName())));
        }

        return authorities;
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

package com.hms.common.config;

import com.hms.entity.auth.User;
import com.hms.repository.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override // Khúc này sẽ tự động chuyển sang màu xanh lá cây mượt mà ngay lập tức!
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Tìm user theo username của dự án bạn
        User user = userRepository.findUserByUserName(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Trả về đối tượng bọc UserPrincipal
        return UserPrincipal.create(user);
    }
}
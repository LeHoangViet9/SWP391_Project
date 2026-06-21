package com.hms.entity.auth;

import com.hms.common.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name="users")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "full_name",nullable = false, length = 100)
    private String fullName;
    @Column(name = "email", nullable = false,unique = true,length = 100)
    private String email;
    @Column(name="phone",nullable = false,unique = true,length = 15)
    private String phone;
    @Column(name = "password", nullable = false,length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 20,columnDefinition = "VARCHAR(20) DEFAULT 'ACTIVE'")
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    @Column(name = "banned_reason",length = 100)
    private String bannedReason;
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id",nullable = false)
    private Role role;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_permissions",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> customPermissions = new HashSet<>();
    @Column(name = "reset_password_token",unique = true)
    private String resetPasswordToken;
    @Column(name = "reset_password_expire_at")
    private LocalDateTime resetPasswordExpiredAt;

    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;
}

package com.hms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    @Column(name = "user_name",nullable = false,length = 100)
    private String userName;
    @Column(name = "full_name",nullable = false, length = 100)
    private String fullName;
    @Column(name = "email", nullable = false,unique = true,length = 100)
    private String email;
    @Column(name="phone",nullable = false,unique = false,length = 15)
    private String phone;
    @Column(name = "password", nullable = false,length = 100)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id",nullable = false)
    private Role role;
}

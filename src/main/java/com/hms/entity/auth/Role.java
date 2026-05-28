package com.hms.entity.auth;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name="roles")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="role_name", unique = true, nullable = false, length = 50)
    private String roleName;
    @Column(name="permissions" ,columnDefinition = "TEXT")
    private String permissions;

    @OneToMany(mappedBy = "role",cascade = CascadeType.ALL)
    private List<User> permissionList;

}

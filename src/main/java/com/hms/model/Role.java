package com.hms.model;

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
    @Column(name="role_name",length =  50)
    private String roleName;
    @Column(name="permissions" ,columnDefinition = "NVARCHAR(MAX)")
    private String permissions;

    @OneToMany(mappedBy = "role",cascade = CascadeType.ALL)
    private List<User> permissionList;

}

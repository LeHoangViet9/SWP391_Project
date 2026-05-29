package com.hms.entity.customer;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.IdType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "full_name",nullable = false)
    private String fullName;
    @Column(nullable = false,unique = true)
    private String email;
    @Column(nullable = false,unique = true)
    private String phone;
    @Column(name = "id_type",nullable = false)
    @Enumerated(EnumType.STRING)
    private IdType idType;
    @Column(name = "id_number_card", nullable = false, unique = true)
    private String idNumberCard;
    private String nationality;
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    @Enumerated(EnumType.STRING)
    private AccountStatus status;
}

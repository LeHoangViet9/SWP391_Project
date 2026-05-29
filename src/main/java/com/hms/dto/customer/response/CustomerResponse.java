package com.hms.dto.customer.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder

public class CustomerResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String idCard;
    private String status;
    private String nationality;
    private LocalDateTime createdAt;
}

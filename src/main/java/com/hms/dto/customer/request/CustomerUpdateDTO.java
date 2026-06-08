package com.hms.dto.customer.request;

import com.hms.common.enums.IdType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomerUpdateDTO {
    private String fullName;
    private String email;
    private String phone;
    private IdType idType;
    private String idNumberCard;
    private String nationality;
}

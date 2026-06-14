package com.hms.dto.customer.request;

import com.hms.common.enums.IdType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

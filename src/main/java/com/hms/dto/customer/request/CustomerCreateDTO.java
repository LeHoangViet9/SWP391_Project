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
public class CustomerCreateDTO {
    @NotBlank(message = "{customer.fullName.notblank}")
    private String fullName;
    @Email(message = "{customer.email.valid}")
    @NotBlank(message = "{customer.email.notblank}")
    private String email;
    @Pattern(regexp = "^0[0-9]{9}$", message = "{customer.phone.valid}")
    @NotBlank(message = "{customer.phone.notblank}")
    private String phone;
    @NotNull(message = "{customer.idtype.notblank}")
    private IdType idType;
    @NotBlank(message = "{customer.idCard.notblank}")
    @Pattern(regexp = "^[A-Za-z0-9\\-]{6,20}$", message = "{customer.idCard.valid}")
    private String idNumberCard;
    @NotBlank(message = "{customer.nationality.notblank}")
    private String nationality;

}

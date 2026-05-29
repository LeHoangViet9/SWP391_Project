package com.hms.custom_validator;

import com.hms.dto.auth.request.UserRegisterRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Objects;

public class PaswordMatchValidator implements ConstraintValidator<RePasswordMatch, UserRegisterRequest> {
    @Override
    public boolean isValid(UserRegisterRequest value, ConstraintValidatorContext context) {
        if(value.getPassword()==null||value.getPassword().isBlank()){
            return true;
        }
        return Objects.equals(value.getPassword(), value.getRePassword());
    }

}

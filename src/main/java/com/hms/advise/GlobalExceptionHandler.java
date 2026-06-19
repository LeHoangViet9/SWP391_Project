package com.hms.advise;

import com.hms.common.dto.ApiResponse;
import com.hms.common.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @Autowired
    private MessageSource messageSource;
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(
            AppException exception
    ) {

        ApiResponse<Object> response = ApiResponse.builder()
                .success(false)
                .message(exception.getMessage())
                .status(exception.getStatus())
                .statusCode(exception.getStatus().value())
                .errorCode(exception.getErrorCode())
                .build();

        return ResponseEntity
                .status(exception.getStatus())
                .body(response);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException exception) {

        Locale locale = LocaleContextHolder.getLocale();

        Map<String, String> errors = new HashMap<>();
        exception.getBindingResult().getAllErrors().forEach(error -> {

            String errorMessage = error.getDefaultMessage();

            String fieldName;

            if (error instanceof FieldError fieldError) {
                fieldName = fieldError.getField();
            } else {
                fieldName = error.getObjectName();
            }

            errors.put(fieldName, errorMessage);
        });
        String validationFailedMessage = messageSource.getMessage("error.validation.failed", null, locale);

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message(validationFailedMessage)
                .data(errors)
                .status(HttpStatus.BAD_REQUEST)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(
            Exception exception
    ) {
        log.error("Unhandled exception", exception);
        Locale locale = LocaleContextHolder.getLocale();

        String message = messageSource.getMessage("error.internal.server", null, "Internal Server Error", locale);

        ApiResponse<Object> response = ApiResponse.builder()
                .success(false)
                .message(message)
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .build();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(IllegalArgumentException ex, Locale locale) {
        String exceptionMsg = ex.getMessage();

        if (exceptionMsg != null && exceptionMsg.matches("\\d+")) {

            String localizedMessage = messageSource.getMessage(
                    "error.time.limit_exceeded", new Object[]{exceptionMsg}, locale);
            return ResponseEntity.badRequest().body(Map.of("error", localizedMessage));
        }
        return ResponseEntity.badRequest().body(Map.of("error", exceptionMsg));
    }
}

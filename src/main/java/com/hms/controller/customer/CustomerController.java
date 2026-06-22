package com.hms.controller.customer;

import com.hms.common.dto.ApiResponse;
import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.service.customer.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final MessageSource messageSource;
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> findAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ACTIVE") AccountStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "ID") SortField sortBy,
            @RequestParam(defaultValue = "ASC") SortDirection direction
    ){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("customer.getall.success", null, locale),
                customerService.getCustomers(keyword, status, page, size, sortBy, direction),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> findById(@PathVariable Long id){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("customer.getbyid.success", null, locale),
                customerService.findById(id),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerCreateDTO  customerCreateDTO){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("customer.add.success", null, locale),
                customerService.createCustomer(customerCreateDTO),
                HttpStatus.CREATED
        ),HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(@Valid @RequestBody CustomerCreateDTO  customerCreateDTO, @PathVariable Long id){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("customer.update.success", null, locale),
                customerService.updateCustomer(id,customerCreateDTO),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(
            @PathVariable Long id
    ){
        Locale locale = LocaleContextHolder.getLocale();
        customerService.deleteCustomer(id);
        return new ResponseEntity<>(new ApiResponse<>(
                        true,
                        messageSource.getMessage("customer.delete.success", null, locale),
                        null,
                        HttpStatus.OK
                ),
                HttpStatus.OK
        );
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restoreCustomer(
            @PathVariable Long id
    ){
        Locale locale = LocaleContextHolder.getLocale();
        customerService.restoreCustomer(id);
        return new ResponseEntity<>(new ApiResponse<>(
                        true,
                        messageSource.getMessage("customer.restore.success", null, locale),
                        null,
                        HttpStatus.OK
                ),
                HttpStatus.OK
        );
    }

    @DeleteMapping("/{id}/force")
    public ResponseEntity<ApiResponse<Void>> forceDeleteCustomer(
            @PathVariable Long id
    ){
        Locale locale = LocaleContextHolder.getLocale();
        customerService.forceDeleteCustomer(id);
        return new ResponseEntity<>(new ApiResponse<>(
                        true,
                        messageSource.getMessage("customer.force_delete.success", null, locale),
                        null,
                        HttpStatus.OK
                ),
                HttpStatus.OK
        );
    }
}

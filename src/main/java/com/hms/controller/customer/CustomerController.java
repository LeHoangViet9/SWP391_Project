package com.hms.controller.customer;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.service.customer.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final MessageSource messageSource;
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> findAll(){
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("customer.getall.success", null, locale),
                customerService.getCustomers(),
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
                        HttpStatus.NO_CONTENT
                ),
                HttpStatus.NO_CONTENT
        );
    }

}

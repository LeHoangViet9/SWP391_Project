package com.hms.controller.customer;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.service.customer.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> findAll(){
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "customer.getall.success",
                customerService.getCustomers(),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> findById(@PathVariable Long id){
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "customer.getbyid.success",
                customerService.findById(id),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@Valid @RequestBody CustomerCreateDTO  customerCreateDTO){
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "customer.add.success",
                customerService.createCustomer(customerCreateDTO),
                HttpStatus.CREATED
        ),HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(@Valid @RequestBody CustomerCreateDTO  customerCreateDTO, @PathVariable Long id){
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                "customer.update.success",
                customerService.updateCustomer(id,customerCreateDTO),
                HttpStatus.OK
        ),HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(
            @PathVariable Long id
    ){
        customerService.deleteCustomer(id);
        return new ResponseEntity<>(new ApiResponse<>(
                        true,
                        "customer.delete.success",
                        null,
                        HttpStatus.NO_CONTENT
                ),
                HttpStatus.NO_CONTENT
        );
    }

}

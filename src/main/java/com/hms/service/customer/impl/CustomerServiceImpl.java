package com.hms.service.customer.impl;

import com.hms.dto.customer.request.CustomerCreateDTO;
import com.hms.dto.customer.response.CustomerResponse;
import com.hms.entity.customer.Customer;
import com.hms.common.enums.AccountStatus;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.repository.customer.CustomerRepository;
import com.hms.service.customer.CustomerService;
import com.hms.service.customer.mapper.CustomerMapper;
import lombok.RequiredArgsConstructor;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {
    private final CustomerRepository customerRepository;
    private final MessageSource messageSource;
    private final CustomerMapper customerMapper;

    @Override
    public CustomerResponse createCustomer(CustomerCreateDTO customerDTO) {
        Locale locale = LocaleContextHolder.getLocale();
        if(customerRepository.existsByEmail(customerDTO.getEmail())) {
            throw new ConflictException(messageSource.getMessage("error.email.existed", new Object[]{customerDTO.getEmail()}, locale));
        }
        if(customerRepository.existsByPhone(customerDTO.getPhone())){
            throw new ConflictException(messageSource.getMessage("error.phone.existed", new Object[]{customerDTO.getPhone()}, locale));
        }
        if(customerRepository.existsByIdNumberCard(customerDTO.getIdNumberCard())) {
            throw new ConflictException(messageSource.getMessage("error.idCard.existed", new Object[]{customerDTO.getIdNumberCard()}, locale));
        }
        Customer customer=customerMapper.toEntity(customerDTO);
        Customer savedCustomer=customerRepository.save(customer);

        return customerMapper.toResponse(savedCustomer);
    }

    @Override
    public CustomerResponse updateCustomer(Long id, CustomerCreateDTO dto) {

        Locale locale = LocaleContextHolder.getLocale();

        Customer customer = customerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                "error.customer.notfound",
                                new Object[]{id},
                                locale
                        )
                ));

        if (!customer.getEmail().equals(dto.getEmail()) && customerRepository.existsByEmail(dto.getEmail())) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.email.existed",
                            new Object[]{dto.getEmail()},
                            locale
                    )
            );
        }

        if (!customer.getPhone().equals(dto.getPhone()) && customerRepository.existsByPhone(dto.getPhone())) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.phone.existed",
                            new Object[]{dto.getPhone()},
                            locale
                    )
            );
        }

        if (!customer.getIdNumberCard().equals(dto.getIdNumberCard()) && customerRepository.existsByIdNumberCard(dto.getIdNumberCard())) {
            throw new ConflictException(
                    messageSource.getMessage(
                            "error.idCard.existed",
                            new Object[]{dto.getIdNumberCard()},
                            locale
                    )
            );
        }

        customerMapper.updateCustomerFromDto(dto, customer);

        Customer updatedCustomer =
                customerRepository.save(customer);

        return customerMapper.toResponse(updatedCustomer);
    }
    @Override
    public void deleteCustomer(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage(
                                "error.customer.notfound",
                                new Object[]{id},
                                locale
                        )
                ));
        customer.setStatus(AccountStatus.INACTIVE);
        customerRepository.save(customer);
    }

    @Override
    public List<CustomerResponse> getCustomers() {
        List<Customer> customers =
                customerRepository.findByStatus(AccountStatus.ACTIVE);

        return customerMapper.toResponseList(customers);
    }

    @Override
    public CustomerResponse findById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.customer.notfound", new Object[]{id}, locale)
                ));

        return customerMapper.toResponse(customer);
    }
}

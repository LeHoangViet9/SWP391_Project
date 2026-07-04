package com.hms.service.customer.impl;

import com.hms.common.enums.SortDirection;
import com.hms.common.enums.SortField;
import com.hms.common.utils.PageableUtils;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerServiceImpl implements CustomerService {
    private final CustomerRepository customerRepository;
    private final MessageSource messageSource;
    private final CustomerMapper customerMapper;
    private final PageableUtils pageableUtils;

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerCreateDTO customerDTO) {
        Locale locale = LocaleContextHolder.getLocale();

        // Nếu email đã tồn tại → cập nhật thông tin nếu có thay đổi và trả về customer hiện tại (self-service booking flow)
        if (customerRepository.existsByEmail(customerDTO.getEmail())) {
            Customer customer = customerRepository.findByEmailAndStatus(customerDTO.getEmail(), AccountStatus.ACTIVE)
                    .orElseThrow(() ->
                            new ConflictException(messageSource.getMessage("error.email.existed",
                                    new Object[]{customerDTO.getEmail()}, locale))
                    );

            boolean updated = false;

            if (customerDTO.getFullName() != null && !customerDTO.getFullName().trim().equals(customer.getFullName())) {
                customer.setFullName(customerDTO.getFullName().trim());
                updated = true;
            }

            if (customerDTO.getPhone() != null && !customerDTO.getPhone().trim().equals(customer.getPhone())) {
                if (customerRepository.existsByPhone(customerDTO.getPhone().trim())) {
                    throw new ConflictException(messageSource.getMessage("error.phone.existed", new Object[]{customerDTO.getPhone()}, locale));
                }
                customer.setPhone(customerDTO.getPhone().trim());
                updated = true;
            }

            if (customerDTO.getIdNumberCard() != null && !customerDTO.getIdNumberCard().trim().equals(customer.getIdNumberCard())) {
                if (customerRepository.existsByIdNumberCard(customerDTO.getIdNumberCard().trim())) {
                    throw new ConflictException(messageSource.getMessage("error.idCard.existed", new Object[]{customerDTO.getIdNumberCard()}, locale));
                }
                customer.setIdType(customerDTO.getIdType());
                customer.setIdNumberCard(customerDTO.getIdNumberCard().trim());
                updated = true;
            } else if (customerDTO.getIdType() != null && customerDTO.getIdType() != customer.getIdType()) {
                customer.setIdType(customerDTO.getIdType());
                updated = true;
            }

            if (customerDTO.getNationality() != null && !customerDTO.getNationality().trim().equals(customer.getNationality())) {
                customer.setNationality(customerDTO.getNationality().trim());
                updated = true;
            }

            if (updated) {
                customer = customerRepository.save(customer);
            }

            return customerMapper.toResponse(customer);
        }

        if(customerRepository.existsByPhone(customerDTO.getPhone())){
            throw new ConflictException(messageSource.getMessage("error.phone.existed", new Object[]{customerDTO.getPhone()}, locale));
        }
        if(customerRepository.existsByIdNumberCard(customerDTO.getIdNumberCard())) {
            throw new ConflictException(messageSource.getMessage("error.idCard.existed", new Object[]{customerDTO.getIdNumberCard()}, locale));
        }
        Customer customer = customerMapper.toEntity(customerDTO);
        customer.setStatus(AccountStatus.ACTIVE);
        Customer savedCustomer = customerRepository.save(customer);

        return customerMapper.toResponse(savedCustomer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerCreateDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();

        Customer customer = customerRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.customer.notfound", new Object[]{id}, locale)
                ));

        if (!customer.getEmail().equals(dto.getEmail()) && customerRepository.existsByEmail(dto.getEmail())) {
            throw new ConflictException(
                    messageSource.getMessage("error.email.existed", new Object[]{dto.getEmail()}, locale)
            );
        }

        if (!customer.getPhone().equals(dto.getPhone()) && customerRepository.existsByPhone(dto.getPhone())) {
            throw new ConflictException(
                    messageSource.getMessage("error.phone.existed", new Object[]{dto.getPhone()}, locale)
            );
        }

        if (!customer.getIdNumberCard().equals(dto.getIdNumberCard()) && customerRepository.existsByIdNumberCard(dto.getIdNumberCard())) {
            throw new ConflictException(
                    messageSource.getMessage("error.idCard.existed", new Object[]{dto.getIdNumberCard()}, locale)
            );
        }

        customerMapper.updateCustomerFromDto(dto, customer);
        Customer updatedCustomer = customerRepository.save(customer);

        return customerMapper.toResponse(updatedCustomer);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Customer customer = customerRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.customer.notfound", new Object[]{id}, locale)
                ));

        customer.setStatus(AccountStatus.INACTIVE);
        customerRepository.save(customer);
    }

    @Override
    public Page<CustomerResponse> getCustomers(
            String keyword,
            AccountStatus status,
            Integer page,
            Integer size,
            SortField sortBy,
            SortDirection direction) {

        Pageable pageable = pageableUtils.createPageable(
                page, size, sortBy.getField(), direction);

        return customerRepository
                .searchCustomer(keyword, status, pageable)
                .map(customerMapper::toResponse);
    }


    @Override
    public CustomerResponse findById(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Customer customer = customerRepository.findByIdAndStatus(id, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.customer.notfound", new Object[]{id}, locale)
                ));

        return customerMapper.toResponse(customer);
    }

    @Override
    @Transactional
    public void restoreCustomer(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.customer.notfound", new Object[]{id}, locale)
                ));

        if (customer.getStatus() == AccountStatus.ACTIVE) {
            throw new ConflictException(
                    messageSource.getMessage("error.customer.already_active", null, locale)
            );
        }

        customer.setStatus(AccountStatus.ACTIVE);
        customerRepository.save(customer);
    }

    @Override
    @Transactional
    public void forceDeleteCustomer(Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.customer.notfound", new Object[]{id}, locale)
                ));
        try {
            customerRepository.delete(customer);
            customerRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException(
                    messageSource.getMessage("error.customer.cannot_delete_has_history", null, locale)
            );
        }
    }

    @Override
    public CustomerResponse getCustomerByEmail(String email) {
        return customerRepository.findByEmailAndStatus(email, AccountStatus.ACTIVE)
                .map(customerMapper::toResponse)
                .orElse(null);
    }
}
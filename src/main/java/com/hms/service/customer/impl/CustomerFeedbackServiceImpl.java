package com.hms.service.customer.impl;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.FeedbackStatus;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.dto.customer.request.CustomerFeedbackRequest;
import com.hms.dto.customer.request.FeedbackReplyRequest;
import com.hms.dto.customer.response.CustomerFeedbackResponse;
import com.hms.entity.booking.Booking;
import com.hms.entity.customer.Customer;
import com.hms.entity.customer.CustomerFeedback;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.customer.CustomerFeedbackRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.service.customer.CustomerFeedbackService;
import com.hms.service.customer.mapper.CustomerFeedbackMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomerFeedbackServiceImpl implements CustomerFeedbackService {

    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final MessageSource messageSource;
    private final CustomerFeedbackMapper customerFeedbackMapper;

    @Override
    @Transactional
    public CustomerFeedbackResponse createFeedback(CustomerFeedbackRequest request, String email) {
        Locale locale = LocaleContextHolder.getLocale();
        Customer customer = customerRepository.findByEmailAndStatus(email, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.customer.notfound", null, locale)
                ));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.booking.notfound", null, locale)
                ));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.booking.not_owner", null, locale)
            );
        }

        if (booking.getBookingStatus() != BookingStatus.CHECKED_OUT) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.booking.not_checked_out", null, locale)
            );
        }

        if (customerFeedbackRepository.existsByBookingId(booking.getId())) {
            throw new ConflictException(
                    messageSource.getMessage("error.feedback.already_exists", null, locale)
            );
        }

        if (request.getCategory() == null) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.category.invalid", null, locale)
            );
        }

        String normalizedCategory = switch (request.getCategory().toLowerCase()) {
            case "room" -> "Room";
            case "service" -> "Service";
            case "cleanliness" -> "Cleanliness";
            case "staff" -> "Staff";
            default -> throw new BadRequestException(
                    messageSource.getMessage("error.feedback.category.invalid", null, locale)
            );
        };

        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(booking)
                .customer(customer)
                .rating(request.getRating())
                .category(normalizedCategory)
                .comment(request.getComment())
                .status(FeedbackStatus.PENDING)
                .build();

        return customerFeedbackMapper.toResponse(customerFeedbackRepository.save(feedback));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerFeedbackResponse> searchFeedback(String keyword, Integer rating, String status, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        FeedbackStatus enumStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                enumStatus = FeedbackStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore or handle invalid status
            }
        }
        Page<CustomerFeedback> feedbackPage = customerFeedbackRepository.searchFeedback(keyword, rating, enumStatus, category, pageable);
        return feedbackPage.map(customerFeedbackMapper::toResponse);
    }

    @Override
    @Transactional
    public CustomerFeedbackResponse replyFeedback(Long feedbackId, FeedbackReplyRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        CustomerFeedback feedback = customerFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.notfound", null, locale)
                ));

        feedback.setReply(request.getReply());
        feedback.setStatus(FeedbackStatus.REVIEWED);
        feedback.setReplyAt(LocalDateTime.now());
        return customerFeedbackMapper.toResponse(customerFeedbackRepository.save(feedback));
    }

    @Override
    @Transactional 
    public void deleteFeedback(Long feedbackId) {
        Locale locale = LocaleContextHolder.getLocale();
        CustomerFeedback feedback = customerFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.notfound", null, locale)
                ));
        customerFeedbackRepository.delete(feedback);
    }
}

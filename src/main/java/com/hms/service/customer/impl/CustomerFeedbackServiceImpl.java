package com.hms.service.customer.impl;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerFeedbackServiceImpl implements CustomerFeedbackService {

    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final MessageSource messageSource;

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

        List<CustomerFeedback> existing = customerFeedbackRepository.findByBookingId(booking.getId());
        if (!existing.isEmpty()) {
            throw new ConflictException(
                    messageSource.getMessage("error.feedback.already_exists", null, locale)
            );
        }

        String normalizedCategory = request.getCategory();
        if (normalizedCategory.equalsIgnoreCase("room")) {
            normalizedCategory = "Room";
        } else if (normalizedCategory.equalsIgnoreCase("service")) {
            normalizedCategory = "Service";
        } else if (normalizedCategory.equalsIgnoreCase("cleanliness")) {
            normalizedCategory = "Cleanliness";
        } else if (normalizedCategory.equalsIgnoreCase("staff")) {
            normalizedCategory = "Staff";
        } else {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.category.invalid", null, locale)
            );
        }

        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(booking)
                .customer(customer)
                .rating(request.getRating())
                .category(normalizedCategory)
                .comment(request.getComment())
                .status("pending")
                .build();

        CustomerFeedback saved = customerFeedbackRepository.save(feedback);
        return convertToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerFeedbackResponse> searchFeedback(String keyword, Integer rating, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<CustomerFeedback> feedbackPage = customerFeedbackRepository.searchFeedback(keyword, rating, pageable);
        return feedbackPage.map(this::convertToResponse);
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
        feedback.setStatus("reviewed");
        CustomerFeedback saved = customerFeedbackRepository.save(feedback);
        return convertToResponse(saved);
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

    private CustomerFeedbackResponse convertToResponse(CustomerFeedback feedback) {
        return CustomerFeedbackResponse.builder()
                .id(feedback.getId())
                .bookingId(feedback.getBooking().getId())
                .customerName(feedback.getCustomer().getFullName())
                .roomTypeName(feedback.getBooking().getRoomType() != null ? feedback.getBooking().getRoomType().getTypeName() : null)
                .rating(feedback.getRating())
                .category(feedback.getCategory())
                .comment(feedback.getComment())
                .status(feedback.getStatus())
                .createdAt(feedback.getCreatedAt())
                .reply(feedback.getReply())
                .build();
    }
}

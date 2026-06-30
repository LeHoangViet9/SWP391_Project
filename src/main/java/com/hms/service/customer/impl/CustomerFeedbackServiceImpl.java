package com.hms.service.customer.impl;

import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.FeedbackStatus;
import com.hms.common.enums.SortDirection;
import com.hms.common.exception.BadRequestException;
import com.hms.common.exception.ConflictException;
import com.hms.common.exception.ResourceNotFoundException;
import com.hms.common.utils.PageableUtils;
import com.hms.dto.customer.request.CustomerFeedbackRequest;
import com.hms.dto.customer.request.FeedbackReplyRequest;
import com.hms.dto.customer.response.CustomerFeedbackResponse;
import com.hms.dto.customer.response.FeedbackStatsResponse;
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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerFeedbackServiceImpl implements CustomerFeedbackService {

    private static final Set<String> VALID_CATEGORIES = Set.of("Room", "Service", "Cleanliness", "Staff");

    private final CustomerFeedbackRepository customerFeedbackRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final MessageSource messageSource;
    private final CustomerFeedbackMapper customerFeedbackMapper;
    private final PageableUtils pageableUtils;

    @Override
    @Transactional
    public CustomerFeedbackResponse createFeedback(CustomerFeedbackRequest request, String email) {
        Locale locale = LocaleContextHolder.getLocale();

        Customer customer = customerRepository.findByEmailAndStatus(email, AccountStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.customer.notfound", null, locale)));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.booking.notfound", null, locale)));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.booking.not_owner", null, locale));
        }

        if (booking.getBookingStatus() != BookingStatus.CHECKED_OUT) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.booking.not_checked_out", null, locale));
        }

        if (customerFeedbackRepository.existsByBookingId(booking.getId())) {
            throw new ConflictException(
                    messageSource.getMessage("error.feedback.already_exists", null, locale));
        }

        if (!VALID_CATEGORIES.contains(request.getCategory())) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.category.invalid", null, locale));
        }

        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(booking)
                .customer(customer)
                .rating(request.getRating())
                .category(request.getCategory())
                .comment(request.getComment())
                .status(FeedbackStatus.PENDING)
                .build();

        return customerFeedbackMapper.toResponse(customerFeedbackRepository.save(feedback));
    }

    @Override
    public List<CustomerFeedbackResponse> getMyFeedbacks(String email) {
        return customerFeedbackRepository.findByCustomerEmail(email)
                .stream()
                .map(customerFeedbackMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CustomerFeedbackResponse updateMyFeedback(Long feedbackId, CustomerFeedbackRequest request, String email) {
        Locale locale = LocaleContextHolder.getLocale();

        CustomerFeedback feedback = customerFeedbackRepository.findByIdAndCustomerEmail(feedbackId, email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.notfound", null, locale)));

        if (feedback.getStatus() != FeedbackStatus.PENDING) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.cannot_update_after_reply", null, locale));
        }

        if (!VALID_CATEGORIES.contains(request.getCategory())) {
            throw new BadRequestException(
                    messageSource.getMessage("error.feedback.category.invalid", null, locale));
        }

        feedback.setRating(request.getRating());
        feedback.setCategory(request.getCategory());
        feedback.setComment(request.getComment());
        return customerFeedbackMapper.toResponse(customerFeedbackRepository.save(feedback));
    }

    @Override
    @Transactional
    public void deleteMyFeedback(Long feedbackId, String email) {
        Locale locale = LocaleContextHolder.getLocale();

        CustomerFeedback feedback = customerFeedbackRepository.findByIdAndCustomerEmail(feedbackId, email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.notfound", null, locale)));

        customerFeedbackRepository.delete(feedback);
    }

    @Override
    public Page<CustomerFeedbackResponse> searchFeedback(String keyword, FeedbackStatus status, Integer rating, String category, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "createdAt", SortDirection.DESC);

        return customerFeedbackRepository
                .searchFeedback(keyword, status, rating, category, pageable)
                .map(customerFeedbackMapper::toResponse);
    }

    @Override
    @Transactional
    public CustomerFeedbackResponse replyFeedback(Long feedbackId, FeedbackReplyRequest request) {
        Locale locale = LocaleContextHolder.getLocale();

        CustomerFeedback feedback = customerFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        messageSource.getMessage("error.feedback.notfound", null, locale)));

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
                        messageSource.getMessage("error.feedback.notfound", null, locale)));

        customerFeedbackRepository.delete(feedback);
    }

    @Override
    public FeedbackStatsResponse getFeedbackStats(String keyword, FeedbackStatus status, String category) {
        List<Object[]> rawStats = customerFeedbackRepository.getFeedbackStats(keyword, status, category);

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        long totalReviews = 0;
        long totalRatingSum = 0;

        for (Object[] row : rawStats) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            if (rating != null && count != null) {
                distribution.put(rating, count);
                totalReviews += count;
                totalRatingSum += (rating * count);
            }
        }

        double averageRating = totalReviews > 0 ? (double) totalRatingSum / totalReviews : 0.0;
        averageRating = Math.round(averageRating * 10.0) / 10.0;

        return FeedbackStatsResponse.builder()
                .averageRating(averageRating)
                .totalReviews(totalReviews)
                .ratingDistribution(distribution)
                .build();
    }

    @Override
    public List<CustomerFeedbackResponse> getPublicFeedbacks() {
        return customerFeedbackRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(customerFeedbackMapper::toResponse)
                .toList();
    }

    @Override
    public Page<CustomerFeedbackResponse> searchPublicFeedback(String keyword, Integer rating, String category, Integer page, Integer size) {
        Pageable pageable = pageableUtils.createPageable(page, size, "createdAt", SortDirection.DESC);

        return customerFeedbackRepository
                .searchFeedback(keyword, null, rating, category, pageable)
                .map(customerFeedbackMapper::toResponse);
    }

    @Override
    public FeedbackStatsResponse getPublicFeedbackStats(String keyword, String category) {
        return getFeedbackStats(keyword, null, category);
    }
}

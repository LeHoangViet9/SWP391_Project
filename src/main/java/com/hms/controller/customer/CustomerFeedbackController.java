package com.hms.controller.customer;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.customer.request.CustomerFeedbackRequest;
import com.hms.dto.customer.request.FeedbackReplyRequest;
import com.hms.dto.customer.response.CustomerFeedbackResponse;
import com.hms.service.customer.CustomerFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
public class CustomerFeedbackController {

    private final CustomerFeedbackService customerFeedbackService;
    private final MessageSource messageSource;

    // 1. Gửi đánh giá -> Quyền tạo (FEEDBACK_CREATE)
    @PostMapping
    @PreAuthorize("hasAuthority('FEEDBACK_CREATE')")
    public ResponseEntity<ApiResponse<CustomerFeedbackResponse>> createFeedback(
            @Valid @RequestBody CustomerFeedbackRequest request,
            @AuthenticationPrincipal String email) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.create", null, "Feedback submitted successfully", locale),
                customerFeedbackService.createFeedback(request, email),
                HttpStatus.CREATED
        ), HttpStatus.CREATED);
    }

    // 2. Tìm kiếm & lọc đánh giá -> Quyền xem (FEEDBACK_VIEW)
    @GetMapping
    @PreAuthorize("hasAuthority('FEEDBACK_VIEW')")
    public ResponseEntity<ApiResponse<Page<CustomerFeedbackResponse>>> searchFeedback(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.search", null, "Feedbacks retrieved successfully", locale),
                customerFeedbackService.searchFeedback(keyword, rating, status, category, page, size),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    // 3. Phản hồi đánh giá -> Quyền cập nhật (FEEDBACK_UPDATE)
    @PutMapping("/{id}/reply")
    @PreAuthorize("hasAuthority('FEEDBACK_UPDATE')")
    public ResponseEntity<ApiResponse<CustomerFeedbackResponse>> replyFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackReplyRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.reply", null, "Reply submitted successfully", locale),
                customerFeedbackService.replyFeedback(id, request),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    // 4. Xóa đánh giá -> Quyền xóa (FEEDBACK_DELETE)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('FEEDBACK_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        customerFeedbackService.deleteFeedback(id);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.delete", null, "Feedback deleted successfully", locale),
                null,
                HttpStatus.OK
        ), HttpStatus.OK);
    }
}

package com.hms.controller.customer;

import com.hms.common.dto.ApiResponse;
import com.hms.dto.customer.request.CustomerFeedbackRequest;
import com.hms.dto.customer.request.FeedbackReplyRequest;
import com.hms.dto.customer.response.CustomerFeedbackResponse;
import com.hms.dto.customer.response.FeedbackStatsResponse;
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
import com.hms.common.enums.FeedbackStatus;

import java.util.List;
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
                messageSource.getMessage("success.feedback.create", null, locale),
                customerFeedbackService.createFeedback(request, email),
                HttpStatus.CREATED
        ), HttpStatus.CREATED);
    }

    // 2. Xem danh sách feedback của bản thân -> Quyền (FEEDBACK_VIEW_OWN)
    @GetMapping("/my")
    @PreAuthorize("hasAuthority('FEEDBACK_VIEW_OWN')")
    public ResponseEntity<ApiResponse<List<CustomerFeedbackResponse>>> getMyFeedbacks(
            @AuthenticationPrincipal String email) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.getmy", null, locale),
                customerFeedbackService.getMyFeedbacks(email),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    // 3. Sửa feedback của bản thân (chỉ khi PENDING) -> Quyền (FEEDBACK_UPDATE_OWN)
    @PutMapping("/my/{id}")
    @PreAuthorize("hasAuthority('FEEDBACK_UPDATE_OWN')")
    public ResponseEntity<ApiResponse<CustomerFeedbackResponse>> updateMyFeedback(
            @PathVariable Long id,
            @Valid @RequestBody CustomerFeedbackRequest request,
            @AuthenticationPrincipal String email) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.update", null, locale),
                customerFeedbackService.updateMyFeedback(id, request, email),
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    // 4. Xóa feedback của bản thân -> Quyền (FEEDBACK_DELETE_OWN)
    @DeleteMapping("/my/{id}")
    @PreAuthorize("hasAuthority('FEEDBACK_DELETE_OWN')")
    public ResponseEntity<ApiResponse<Void>> deleteMyFeedback(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        Locale locale = LocaleContextHolder.getLocale();
        customerFeedbackService.deleteMyFeedback(id, email);
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.delete", null, locale),
                null,
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    // 5. Tìm kiếm & lọc đánh giá -> Quyền xem (FEEDBACK_VIEW)
    @GetMapping
    @PreAuthorize("hasAuthority('FEEDBACK_VIEW')")
    public ResponseEntity<ApiResponse<Page<CustomerFeedbackResponse>>> searchFeedback(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.search", null, locale),
                customerFeedbackService.searchFeedback(keyword, status, page, size),
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
                messageSource.getMessage("success.feedback.reply", null, locale),
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
                messageSource.getMessage("success.feedback.delete", null, locale),
                null,
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    // 5. Thống kê phản hồi khách hàng -> Quyền xem (FEEDBACK_VIEW)
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('FEEDBACK_VIEW')")
    public ResponseEntity<ApiResponse<FeedbackStatsResponse>> getFeedbackStats(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) FeedbackStatus status) {
        Locale locale = LocaleContextHolder.getLocale();
        return new ResponseEntity<>(new ApiResponse<>(
                true,
                messageSource.getMessage("success.feedback.stats", null, locale),
                customerFeedbackService.getFeedbackStats(keyword, status),
                HttpStatus.OK
        ), HttpStatus.OK);
    }
}

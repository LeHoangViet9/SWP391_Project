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

    @PostMapping
    @PreAuthorize("hasAuthority('FEEDBACK_CREATE')")
    public ResponseEntity<ApiResponse<CustomerFeedbackResponse>> createFeedback(
            @Valid @RequestBody CustomerFeedbackRequest request,
            @AuthenticationPrincipal String email) {
        
        Locale locale = LocaleContextHolder.getLocale();
        CustomerFeedbackResponse data = customerFeedbackService.createFeedback(request, email);
        
        String message = messageSource.getMessage("success.feedback.create", null, "Feedback submitted successfully", locale);
        ApiResponse<CustomerFeedbackResponse> response = ApiResponse.<CustomerFeedbackResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.CREATED)
                .statusCode(HttpStatus.CREATED.value())
                .build();
                
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('FEEDBACK_VIEW')")
    public ResponseEntity<ApiResponse<Page<CustomerFeedbackResponse>>> searchFeedback(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
            
        Locale locale = LocaleContextHolder.getLocale();
        Page<CustomerFeedbackResponse> data = customerFeedbackService.searchFeedback(keyword, rating, status, category, page, size);
        
        String message = messageSource.getMessage("success.feedback.search", null, "Feedbacks retrieved successfully", locale);
        ApiResponse<Page<CustomerFeedbackResponse>> response = ApiResponse.<Page<CustomerFeedbackResponse>>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .statusCode(HttpStatus.OK.value())
                .build();
                
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reply")
    @PreAuthorize("hasAuthority('FEEDBACK_UPDATE')")
    public ResponseEntity<ApiResponse<CustomerFeedbackResponse>> replyFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackReplyRequest request) {
            
        Locale locale = LocaleContextHolder.getLocale();
        CustomerFeedbackResponse data = customerFeedbackService.replyFeedback(id, request);
        
        String message = messageSource.getMessage("success.feedback.reply", null, "Reply submitted successfully", locale);
        ApiResponse<CustomerFeedbackResponse> response = ApiResponse.<CustomerFeedbackResponse>builder()
                .success(true)
                .message(message)
                .data(data)
                .status(HttpStatus.OK)
                .statusCode(HttpStatus.OK.value())
                .build();
                
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('FEEDBACK_DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(@PathVariable Long id) {
        
        Locale locale = LocaleContextHolder.getLocale();
        customerFeedbackService.deleteFeedback(id);
        
        String message = messageSource.getMessage("success.feedback.delete", null, "Feedback deleted successfully", locale);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .status(HttpStatus.OK)
                .statusCode(HttpStatus.OK.value())
                .build();
                
        return ResponseEntity.ok(response);
    }
}

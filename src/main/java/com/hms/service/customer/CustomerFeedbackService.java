package com.hms.service.customer;

import com.hms.dto.customer.request.CustomerFeedbackRequest;
import com.hms.dto.customer.request.FeedbackReplyRequest;
import com.hms.dto.customer.response.CustomerFeedbackResponse;
import org.springframework.data.domain.Page;

public interface CustomerFeedbackService {
    CustomerFeedbackResponse createFeedback(CustomerFeedbackRequest request, String email);
    Page<CustomerFeedbackResponse> searchFeedback(String keyword, Integer rating, int page, int size);
    CustomerFeedbackResponse replyFeedback(Long feedbackId, FeedbackReplyRequest request);
    void deleteFeedback(Long feedbackId);
}

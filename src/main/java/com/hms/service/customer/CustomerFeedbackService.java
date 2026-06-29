package com.hms.service.customer;

import com.hms.dto.customer.request.CustomerFeedbackRequest;
import com.hms.dto.customer.request.FeedbackReplyRequest;
import com.hms.dto.customer.response.CustomerFeedbackResponse;
import com.hms.dto.customer.response.FeedbackStatsResponse;
import org.springframework.data.domain.Page;
import java.util.List;

public interface CustomerFeedbackService {
    CustomerFeedbackResponse createFeedback(CustomerFeedbackRequest request, String email);
    List<CustomerFeedbackResponse> getMyFeedbacks(String email);
    CustomerFeedbackResponse updateMyFeedback(Long feedbackId, CustomerFeedbackRequest request, String email);
    void deleteMyFeedback(Long feedbackId, String email);
    Page<CustomerFeedbackResponse> searchFeedback(String keyword, Integer rating, String status, String category, Integer page, Integer size);
    CustomerFeedbackResponse replyFeedback(Long feedbackId, FeedbackReplyRequest request);
    void deleteFeedback(Long feedbackId);
    FeedbackStatsResponse getFeedbackStats(String keyword, String status, String category);
}

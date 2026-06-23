package com.hms.dto.customer.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CustomerFeedbackResponse {
    private Long id;
    private Long bookingId;
    private String customerName;
    private String roomTypeName;
    private int rating;
    private String category;
    private String comment;
    private String status;
    private LocalDateTime createdAt;
    private String reply;
}

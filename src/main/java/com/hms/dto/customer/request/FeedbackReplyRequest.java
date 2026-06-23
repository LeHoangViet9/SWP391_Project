package com.hms.dto.customer.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FeedbackReplyRequest {
    @NotBlank(message = "Reply content is required")
    private String reply;
}

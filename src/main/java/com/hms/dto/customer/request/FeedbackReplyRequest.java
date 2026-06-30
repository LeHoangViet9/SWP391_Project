package com.hms.dto.customer.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackReplyRequest {
    @NotBlank(message = "Reply content is required")
    @Size(max = 1000, message = "Reply cannot exceed 1000 characters")
    private String reply;
}

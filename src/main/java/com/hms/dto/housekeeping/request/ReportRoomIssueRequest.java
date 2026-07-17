package com.hms.dto.housekeeping.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRoomIssueRequest {

    @JsonAlias("issueDescription")
    @NotBlank(message = "Reason is required when reporting an issue")
    private String reason;

    private String severity;

    private Long reportedById; // User ID of the person reporting the issue
}

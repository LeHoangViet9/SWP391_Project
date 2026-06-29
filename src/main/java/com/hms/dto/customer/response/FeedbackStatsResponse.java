package com.hms.dto.customer.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackStatsResponse {
    private double averageRating;
    private long totalReviews;
    private Map<Integer, Long> ratingDistribution;
}

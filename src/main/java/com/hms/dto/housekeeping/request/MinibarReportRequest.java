package com.hms.dto.housekeeping.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class MinibarReportRequest {
    @Min(0)
    private int water;

    @Min(0)
    private int cola;

    @Min(0)
    private int beer;

    @Min(0)
    private int snack;
}

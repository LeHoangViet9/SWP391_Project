package com.hms.dto.booking.request;

import com.hms.common.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingStatusRequest {

    @NotNull(message = "{booking.status.notnull}")
    private BookingStatus status;

    /** Ghi chú tùy chọn (ví dụ: lý do hủy) */
    private String note;
}

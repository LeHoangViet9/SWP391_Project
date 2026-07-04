package com.hms.dto.booking.response;

import com.hms.common.enums.BookingStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.hms.dto.booking.request.RoomGuestRequest;

@Data
public class BookingResponse {
    private Long id;

    private Long customerId;

    private String customerName;

    private Long roomTypeId;

    private String roomTypeName;

    private Long roomId;

    private String roomNumber;

    private List<Long> roomIds;

    private List<String> roomNumbers;

    private List<RoomGuestRequest> roomGuests;

    private BigDecimal pricePerNight;

    private Integer quantity;

    private LocalDateTime checkInDate;

    private LocalDateTime checkOutDate;

    private BigDecimal totalPrice;

    private BookingStatus bookingStatus;

    private LocalDateTime createdAt;

    private Boolean hasFeedback;

    private LocalDateTime holdExpiresAt;

    private Boolean bookingForOther;

    private String guestFullName;

    private String guestEmail;

    private String guestPhone;

    private String guestIdType;

    private String guestIdNumberCard;

    private String guestNationality;
}


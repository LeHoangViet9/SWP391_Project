package com.hms.dto.booking.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.validation.Valid;

@Data
public class BookingRequest {
    @NotNull(message = "{booking.customer.notnull}")
    private Long customerId;

    @NotNull(message = "{booking.roomtype.notnull}")
    private Long roomTypeId;

    // The concrete room selected in the cart. When omitted, the backend picks one
    // atomically so older clients remain compatible.
    private Long roomId;

    @NotNull(message = "{booking.checkin.notnull}")
    private LocalDateTime checkInDate;

    @NotNull(message = "{booking.quantity.notnull}")
    @Min(value = 1, message = "{booking.quantity.min}")
    private Integer quantity;

    @Valid
    private List<RoomGuestRequest> roomGuests;

    @NotNull(message = "{booking.checkout.notnull}")
    private LocalDateTime checkOutDate;

    private Boolean bookingForOther = false;

    private String guestFullName;

    private String guestEmail;

    private String guestPhone;

    private String guestIdType;

    private String guestIdNumberCard;

    private String guestNationality;

    // Internal capability fields used only when converting a server-side cart hold.
    private String cartHoldToken;
    private Long cartHoldItemId;

}

package com.hms.dto.booking.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder.Default;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartHoldCheckoutRequest {

    @NotNull
    private Long customerId;

    @Default
    private Boolean bookingForOther = false;
    private String guestFullName;
    private String guestEmail;
    private String guestPhone;
    private String guestIdType;
    private String guestIdNumberCard;
    private String guestNationality;

    @NotEmpty
    @Valid
    private List<CartHoldCheckoutItemRequest> items;
}

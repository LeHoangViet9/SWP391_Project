package com.hms.dto.booking.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartHoldCheckoutItemRequest {

    @NotNull
    private Long holdItemId;

    @Valid
    private List<RoomGuestRequest> roomGuests;
}

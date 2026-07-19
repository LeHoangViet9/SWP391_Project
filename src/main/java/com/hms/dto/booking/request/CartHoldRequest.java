package com.hms.dto.booking.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartHoldRequest {

    @NotEmpty
    @Size(max = 10)
    @Valid
    private List<CartHoldItemRequest> items;
}
